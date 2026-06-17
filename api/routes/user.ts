import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import type { User, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    sql += ' ORDER BY name';
    const rows = db.prepare(sql).all(...params) as any[];
    const users: User[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      role: row.role,
      department: row.department,
      avatar: row.avatar,
      createdAt: row.created_at,
    }));
    res.json({ success: true, data: users } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!row) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      } as ApiResponse);
    }
    const user: User = {
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      role: row.role,
      department: row.department,
      avatar: row.avatar,
      createdAt: row.created_at,
    };
    res.json({ success: true, data: user } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/login', (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: '缺少工号参数'
      } as ApiResponse);
    }
    const row = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employeeId) as any;
    if (!row) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      } as ApiResponse);
    }
    const user: User = {
      id: row.id,
      name: row.name,
      employeeId: row.employee_id,
      role: row.role,
      department: row.department,
      avatar: row.avatar,
      createdAt: row.created_at,
    };
    res.json({ success: true, data: user, message: '登录成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
