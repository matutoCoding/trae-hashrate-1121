import { db } from '../db/index.js';
import type { ConsumptionRecord, Settlement } from '../../shared/types.js';

export class ConsumptionService {
  static getUserConsumption(userId: string, limit: number = 50): ConsumptionRecord[] {
    const rows = db.prepare(`
      SELECT * FROM consumption_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      amount: row.amount,
      paymentMethod: row.payment_method,
      quotaUsed: row.quota_used,
      selfPayAmount: row.self_pay_amount,
      stallId: row.stall_id,
      stallName: row.stall_name,
      items: row.items,
      createdAt: row.created_at,
    }));
  }

  static getConsumptionByOrder(orderId: string): ConsumptionRecord | null {
    const row = db.prepare(`
      SELECT * FROM consumption_records WHERE order_id = ?
    `).get(orderId) as any;

    if (!row) return null;

    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      amount: row.amount,
      paymentMethod: row.payment_method,
      quotaUsed: row.quota_used,
      selfPayAmount: row.self_pay_amount,
      stallId: row.stall_id,
      stallName: row.stall_name,
      items: row.items,
      createdAt: row.created_at,
    };
  }

  static getSettlement(stallId: string, date?: string): Settlement | null {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const row = db.prepare(`
      SELECT * FROM settlements WHERE stall_id = ? AND date = ?
    `).get(stallId, targetDate) as any;

    if (!row) return null;

    return {
      id: row.id,
      stallId: row.stall_id,
      stallName: row.stall_name,
      date: row.date,
      totalOrders: row.total_orders,
      totalAmount: row.total_amount,
      settlementAmount: row.settlement_amount,
      commissionRate: row.commission_rate,
      commissionAmount: row.commission_amount,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  static getSettlementsByDate(date?: string): Settlement[] {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const rows = db.prepare(`
      SELECT * FROM settlements WHERE date = ? ORDER BY stall_id
    `).all(targetDate) as any[];

    return rows.map(row => ({
      id: row.id,
      stallId: row.stall_id,
      stallName: row.stall_name,
      date: row.date,
      totalOrders: row.total_orders,
      totalAmount: row.total_amount,
      settlementAmount: row.settlement_amount,
      commissionRate: row.commission_rate,
      commissionAmount: row.commission_amount,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  static getUserMonthlyStats(userId: string, month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const result = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(amount) as total_amount,
        SUM(quota_used) as total_quota_used,
        SUM(self_pay_amount) as total_self_pay
      FROM consumption_records
      WHERE user_id = ? AND strftime('%Y-%m', created_at) = ?
    `).get(userId, targetMonth) as any;

    return {
      totalOrders: result.total_orders || 0,
      totalAmount: result.total_amount || 0,
      totalQuotaUsed: result.total_quota_used || 0,
      totalSelfPay: result.total_self_pay || 0,
    };
  }

  static confirmSettlement(settlementId: string): boolean {
    const result = db.prepare(`
      UPDATE settlements
      SET status = 'settled'
      WHERE id = ? AND status = 'pending'
    `).run(settlementId);

    return result.changes > 0;
  }
}
