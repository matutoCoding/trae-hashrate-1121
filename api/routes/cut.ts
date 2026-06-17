import { Router, Request, Response } from 'express';
import { CutRecordService } from '../services/cutRecord.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/records', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const records = CutRecordService.getCutRecords(limit);
    res.json({ success: true, data: records } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/records/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const records = CutRecordService.getCutRecordsByUser(userId, limit);
    res.json({ success: true, data: records } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/records/order/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const record = CutRecordService.getCutRecordByOrder(orderId);
    if (!record) {
      return res.json({ success: true, data: null } as ApiResponse);
    }
    res.json({ success: true, data: record } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
