import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { Order, QueueItem, OrderPriority, OrderStatus, CreateOrderRequest, OrderItem, PaymentMethod, QueueStats } from '../../shared/types.js';
import { QuotaService } from './quota.js';

const PRIORITY_WEIGHT: Record<OrderPriority, number> = {
  urgent: 3,
  vip: 2,
  normal: 1,
};

export class QueueService {
  private static getNextTicketNumber(stallId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const result = db.prepare(`
      SELECT COALESCE(MAX(ticket_number), 0) as max_num
      FROM orders
      WHERE stall_id = ? AND DATE(created_at) = ?
    `).get(stallId, today) as { max_num: number };
    return result.max_num + 1;
  }

  private static calculateEstimatedWaitTime(queuePosition: number): number {
    return queuePosition * 5;
  }

  private static getWaitingQueueRaw(stallId?: string): any[] {
    let sql = `
      SELECT o.* FROM orders o
      WHERE o.status IN ('waiting', 'calling')
    `;
    const params: any[] = [];

    if (stallId) {
      sql += ' AND o.stall_id = ?';
      params.push(stallId);
    }

    sql += `
      ORDER BY
        CASE o.priority
          WHEN 'urgent' THEN 3
          WHEN 'vip' THEN 2
          WHEN 'normal' THEN 1
        END DESC,
        o.created_at ASC
    `;

    return db.prepare(sql).all(...params) as any[];
  }

  static getQueue(stallId?: string): QueueItem[] {
    const orders = this.getWaitingQueueRaw(stallId);
    return orders.map((row, index) => ({
      orderId: row.id,
      ticketNumber: row.ticket_number,
      userName: row.user_name,
      priority: row.priority,
      queuePosition: index + 1,
      estimatedWaitTime: this.calculateEstimatedWaitTime(index),
      status: row.status,
      stallId: row.stall_id,
      stallName: row.stall_name,
      totalAmount: row.total_amount,
    }));
  }

  static getQueueStats(stallId?: string): QueueStats {
    const queue = this.getQueue(stallId);
    const calling = queue.find(q => q.status === 'calling');

    const today = new Date().toISOString().slice(0, 10);
    let sql = `
      SELECT COUNT(*) as count FROM orders
      WHERE status = 'completed' AND DATE(created_at) = ?
    `;
    const params: any[] = [today];
    if (stallId) {
      sql += ' AND stall_id = ?';
      params.push(stallId);
    }
    const completedResult = db.prepare(sql).get(...params) as { count: number };

    const waitingCount = queue.filter(q => q.status === 'waiting').length;
    const avgWaitTime = waitingCount > 0 ? Math.round(queue.reduce((sum, q) => sum + q.estimatedWaitTime, 0) / waitingCount) : 0;

    return {
      currentCalling: calling,
      waitingCount,
      avgWaitTime: Math.round(avgWaitTime),
      todayCompleted: completedResult.count,
    };
  }

  private static getOrderItems(orderId: string): OrderItem[] {
    const rows = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(orderId) as any[];

    return rows.map(row => ({
      id: row.id,
      menuItemId: row.menu_item_id,
      name: row.name,
      price: row.price,
      quantity: row.quantity,
    }));
  }

  static createOrder(request: CreateOrderRequest): Order {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(request.userId) as any;
    if (!user) {
      throw new Error('User not found');
    }

    const stall = db.prepare('SELECT * FROM stalls WHERE id = ?').get(request.stallId) as any;
    if (!stall) {
      throw new Error('Stall not found');
    }

    let totalAmount = 0;
    const orderItems: { menuItem: any; quantity: number }[] = [];

    for (const item of request.items) {
      const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.menuItemId) as any;
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`);
      }
      totalAmount += menuItem.price * item.quantity;
      orderItems.push({ menuItem, quantity: item.quantity });
    }

    const { quotaUsed, selfPayAmount } = QuotaService.deductQuota(request.userId, totalAmount);
    let paymentMethod: PaymentMethod = 'quota';
    if (quotaUsed === 0) {
      paymentMethod = 'self_pay';
    } else if (selfPayAmount > 0) {
      paymentMethod = 'mixed';
    }

    const orderId = uuidv4();
    const ticketNumber = this.getNextTicketNumber(request.stallId);
    const orderNo = `${stall.id.slice(-3).toUpperCase()}${String(ticketNumber).padStart(4, '0')}`;

    const queue = this.getWaitingQueueRaw(request.stallId);
    let queuePosition = queue.length + 1;

    let insertPosition = queue.length;
    const newPriorityWeight = PRIORITY_WEIGHT[request.priority];

    for (let i = 0; i < queue.length; i++) {
      const existingWeight = PRIORITY_WEIGHT[queue[i].priority as OrderPriority];
      if (newPriorityWeight > existingWeight) {
        insertPosition = i;
        queuePosition = i + 1;
        break;
      }
    }

    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (
        id, order_no, ticket_number, user_id, user_name, stall_id, stall_name,
        total_amount, priority, status, payment_method, quota_used, self_pay_amount,
        queue_position, estimated_wait_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, orderNo, ticketNumber, user.id, user.name, stall.id, stall.name,
      totalAmount, request.priority, 'waiting', paymentMethod, quotaUsed, selfPayAmount,
      queuePosition, this.calculateEstimatedWaitTime(queuePosition - 1), now
    );

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const { menuItem, quantity } of orderItems) {
      insertOrderItem.run(uuidv4(), orderId, menuItem.id, menuItem.name, menuItem.price, quantity);
    }

    if (insertPosition < queue.length) {
      const affectedOrders = queue.slice(insertPosition);
      for (const affected of affectedOrders) {
        db.prepare(`
          UPDATE orders SET queue_position = queue_position + 1 WHERE id = ?
        `).run(affected.id);
      }

      const affectedUserIds = affectedOrders.map(o => o.user_id);

      db.prepare(`
        INSERT INTO cut_records (
          id, order_id, user_id, user_name, reason, priority,
          original_position, new_position, affected_users, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), orderId, user.id, user.name,
        request.priority === 'vip' ? 'VIP用户优先' : '加急订单',
        request.priority, queue.length + 1, queuePosition,
        JSON.stringify(affectedUserIds), now
      );
    }

    return this.getOrderById(orderId)!;
  }

  static getOrderById(orderId: string): Order | null {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!row) return null;

    return {
      id: row.id,
      orderNo: row.order_no,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      userName: row.user_name,
      stallId: row.stall_id,
      stallName: row.stall_name,
      items: this.getOrderItems(orderId),
      totalAmount: row.total_amount,
      priority: row.priority,
      status: row.status,
      paymentMethod: row.payment_method,
      quotaUsed: row.quota_used,
      selfPayAmount: row.self_pay_amount,
      queuePosition: row.queue_position,
      estimatedWaitTime: row.estimated_wait_time,
      createdAt: row.created_at,
      calledAt: row.called_at,
      completedAt: row.completed_at,
    };
  }

  static callNextOrder(stallId: string): Order | null {
    const queue = this.getWaitingQueueRaw(stallId);
    const currentCalling = queue.find(q => q.status === 'calling');

    if (currentCalling) {
      return null;
    }

    const nextOrder = queue.find(q => q.status === 'waiting');
    if (!nextOrder) return null;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders SET status = 'calling', called_at = ? WHERE id = ?
    `).run(now, nextOrder.id);

    return this.getOrderById(nextOrder.id);
  }

  static completeOrder(orderId: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE orders SET status = 'completed', completed_at = ? WHERE id = ?
    `).run(now, orderId);

    const itemsStr = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');

    db.prepare(`
      INSERT INTO consumption_records (
      id, order_id, user_id, amount, payment_method, quota_used,
      self_pay_amount, stall_id, stall_name, items, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
      uuidv4(), orderId, order.userId, order.totalAmount, order.paymentMethod,
      order.quotaUsed, order.selfPayAmount, order.stallId, order.stallName,
      itemsStr, now
    );

    const today = now.slice(0, 10);
    const existingSettlement = db.prepare(`
      SELECT * FROM settlements WHERE stall_id = ? AND date = ?
    `).get(order.stallId, today) as any;

    const stall = db.prepare('SELECT commission_rate FROM stalls WHERE id = ?').get(order.stallId) as any;
    const commissionRate = stall ? stall.commission_rate : 0.1;
    const commissionAmount = order.totalAmount * commissionRate;
    const settlementAmount = order.totalAmount - commissionAmount;

    if (existingSettlement) {
      db.prepare(`
        UPDATE settlements
        SET total_orders = total_orders + 1,
            total_amount = total_amount + ?,
            settlement_amount = settlement_amount + ?,
            commission_amount = commission_amount + ?
        WHERE id = ?
      `).run(order.totalAmount, settlementAmount, commissionAmount, existingSettlement.id);
    } else {
      db.prepare(`
        INSERT INTO settlements (
          id, stall_id, stall_name, date, total_orders, total_amount,
          settlement_amount, commission_rate, commission_amount
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      `).run(
        uuidv4(), order.stallId, order.stallName, today,
        order.totalAmount, settlementAmount, commissionRate, commissionAmount
      );
    }

    return this.getOrderById(orderId);
  }

  static cancelOrder(orderId: string): boolean {
    const result = db.prepare(`
      UPDATE orders SET status = 'cancelled' WHERE id = ? AND status IN ('waiting', 'calling')
    `).run(orderId);
    return result.changes > 0;
  }

  static getUserOrders(userId: string, limit: number = 20): Order[] {
    const rows = db.prepare(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      orderNo: row.order_no,
      ticketNumber: row.ticket_number,
      userId: row.user_id,
      userName: row.user_name,
      stallId: row.stall_id,
      stallName: row.stall_name,
      items: this.getOrderItems(row.id),
      totalAmount: row.total_amount,
      priority: row.priority,
      status: row.status,
      paymentMethod: row.payment_method,
      quotaUsed: row.quota_used,
      selfPayAmount: row.self_pay_amount,
      queuePosition: row.queue_position,
      estimatedWaitTime: row.estimated_wait_time,
      createdAt: row.created_at,
      calledAt: row.called_at,
      completedAt: row.completed_at,
    }));
  }
}
