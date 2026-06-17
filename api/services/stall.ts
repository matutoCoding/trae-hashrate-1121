import { db } from '../db/index.js';
import type { Stall, MenuItem } from '../../shared/types.js';

export class StallService {
  static getAllStalls(): Stall[] {
    const rows = db.prepare('SELECT * FROM stalls').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      location: row.location,
      commissionRate: row.commission_rate,
    }));
  }

  static getStallById(stallId: string): Stall | null {
    const row = db.prepare('SELECT * FROM stalls WHERE id = ?').get(stallId) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      location: row.location,
      commissionRate: row.commission_rate,
    };
  }

  static getMenuItems(stallId: string): MenuItem[] {
    const rows = db.prepare(`
      SELECT * FROM menu_items WHERE stall_id = ? ORDER BY category, name
    `).all(stallId) as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      stallId: row.stall_id,
      category: row.category,
      description: row.description,
      image: row.image,
    }));
  }

  static getAllMenuItems(): MenuItem[] {
    const rows = db.prepare(`
      SELECT * FROM menu_items ORDER BY stall_id, category, name
    `).all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      stallId: row.stall_id,
      category: row.category,
      description: row.description,
      image: row.image,
    }));
  }
}
