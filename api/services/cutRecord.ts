import { db } from '../db/index.js';
import type { CutRecord } from '../../shared/types.js';

export class CutRecordService {
  static getCutRecords(limit: number = 50): CutRecord[] {
    const rows = db.prepare(`
      SELECT * FROM cut_records ORDER BY created_at DESC LIMIT ?
    `).all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userName: row.user_name,
      reason: row.reason,
      priority: row.priority,
      originalPosition: row.original_position,
      newPosition: row.new_position,
      affectedUsers: JSON.parse(row.affected_users),
      createdAt: row.created_at,
      approvedBy: row.approved_by,
    }));
  }

  static getCutRecordsByUser(userId: string, limit: number = 50): CutRecord[] {
    const rows = db.prepare(`
      SELECT * FROM cut_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userName: row.user_name,
      reason: row.reason,
      priority: row.priority,
      originalPosition: row.original_position,
      newPosition: row.new_position,
      affectedUsers: JSON.parse(row.affected_users),
      createdAt: row.created_at,
      approvedBy: row.approved_by,
    }));
  }

  static getCutRecordByOrder(orderId: string): CutRecord | null {
    const row = db.prepare(`
      SELECT * FROM cut_records WHERE order_id = ?
    `).get(orderId) as any;

    if (!row) return null;

    return {
      id: row.id,
      orderId: row.order_id,
      userId: row.user_id,
      userName: row.user_name,
      reason: row.reason,
      priority: row.priority,
      originalPosition: row.original_position,
      newPosition: row.new_position,
      affectedUsers: JSON.parse(row.affected_users),
      createdAt: row.created_at,
      approvedBy: row.approved_by,
    };
  }
}
