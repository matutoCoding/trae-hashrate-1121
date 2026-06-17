import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type { Quota } from '../../shared/types.js';

export class QuotaService {
  static getCurrentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  static getUserQuota(userId: string): Quota | null {
    const month = this.getCurrentMonth();
    const row = db.prepare(`
      SELECT * FROM quotas WHERE user_id = ? AND month = ?
    `).get(userId, month) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      monthlyAmount: row.monthly_amount,
      usedAmount: row.used_amount,
      remainingAmount: row.remaining_amount,
      month: row.month,
      lastResetAt: row.last_reset_at,
      createdAt: row.created_at,
    };
  }

  static getUserQuotas(userId: string): Quota[] {
    const rows = db.prepare(`
      SELECT * FROM quotas WHERE user_id = ? ORDER BY month DESC
    `).all(userId) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      monthlyAmount: row.monthly_amount,
      usedAmount: row.used_amount,
      remainingAmount: row.remaining_amount,
      month: row.month,
      lastResetAt: row.last_reset_at,
      createdAt: row.created_at,
    }));
  }

  static deductQuota(userId: string, amount: number): { quotaUsed: number; selfPayAmount: number } {
    const quota = this.getUserQuota(userId);
    if (!quota) {
      return { quotaUsed: 0, selfPayAmount: amount };
    }

    const quotaUsed = Math.min(quota.remainingAmount, amount);
    const selfPayAmount = amount - quotaUsed;

    if (quotaUsed > 0) {
      db.prepare(`
        UPDATE quotas
        SET used_amount = used_amount + ?, remaining_amount = remaining_amount - ?
        WHERE id = ?
      `).run(quotaUsed, quotaUsed, quota.id);
    }

    return { quotaUsed, selfPayAmount };
  }

  static resetMonthlyQuota(userId: string): boolean {
    const month = this.getCurrentMonth();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user) return false;

    const monthlyAmount = user.role === 'vip' ? 800 : 500;
    const now = new Date().toISOString();

    const existing = db.prepare(`
      SELECT id FROM quotas WHERE user_id = ? AND month = ?
    `).get(userId, month) as any;

    if (existing) {
      db.prepare(`
        UPDATE quotas
        SET monthly_amount = ?, used_amount = 0, remaining_amount = ?, last_reset_at = ?
        WHERE id = ?
      `).run(monthlyAmount, monthlyAmount, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO quotas (id, user_id, monthly_amount, used_amount, remaining_amount, month, last_reset_at)
        VALUES (?, ?, ?, 0, ?, ?, ?)
      `).run(uuidv4(), userId, monthlyAmount, monthlyAmount, month, now);
    }

    return true;
  }

  static resetAllQuotas(): number {
    const users = db.prepare('SELECT id, role FROM users').all() as any[];
    let count = 0;
    for (const user of users) {
      if (this.resetMonthlyQuota(user.id)) {
        count++;
      }
    }
    return count;
  }

  static adjustQuota(userId: string, amount: number): boolean {
    const result = db.prepare(`
      UPDATE quotas
      SET remaining_amount = remaining_amount + ?, monthly_amount = monthly_amount + ?
      WHERE user_id = ? AND month = ?
    `).run(amount, amount, userId, this.getCurrentMonth());

    return result.changes > 0;
  }

  static createQuotaForNewUser(userId: string, role: string): void {
    const month = this.getCurrentMonth();
    const monthlyAmount = role === 'vip' ? 800 : 500;

    db.prepare(`
      INSERT OR IGNORE INTO quotas (id, user_id, monthly_amount, used_amount, remaining_amount, month)
      VALUES (?, ?, ?, 0, ?, ?)
    `).run(uuidv4(), userId, monthlyAmount, monthlyAmount, month);
  }
}
