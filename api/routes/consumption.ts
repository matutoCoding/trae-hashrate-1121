import { Router, Request, Response } from 'express';
import { ConsumptionService } from '../services/consumption.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const records = ConsumptionService.getUserConsumption(userId, limit);
    res.json({ success: true, data: records } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/order/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const record = ConsumptionService.getConsumptionByOrder(orderId);
    if (!record) {
      return res.status(404).json({
        success: false,
        error: '消费记录不存在'
      } as ApiResponse);
    }
    res.json({ success: true, data: record } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/stats/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const month = req.query.month as string | undefined;
    const stats = ConsumptionService.getUserMonthlyStats(userId, month);
    res.json({ success: true, data: stats } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/settlement/stall/:stallId', (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const date = req.query.date as string | undefined;
    const settlement = ConsumptionService.getSettlement(stallId, date);
    if (!settlement) {
      return res.json({
        success: true,
        data: null,
        message: '该日期暂无结算数据'
      } as ApiResponse);
    }
    res.json({ success: true, data: settlement } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/settlement', (req: Request, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const settlements = ConsumptionService.getSettlementsByDate(date);
    res.json({ success: true, data: settlements } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
