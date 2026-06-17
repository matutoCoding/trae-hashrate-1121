import { Router, Request, Response } from 'express';
import { QuotaService } from '../services/quota.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const quota = QuotaService.getUserQuota(userId);
    if (!quota) {
      return res.status(404).json({
        success: false,
        error: '用户额度信息不存在'
      } as ApiResponse);
    }
    res.json({ success: true, data: quota } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/:userId/history', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const quotas = QuotaService.getUserQuotas(userId);
    res.json({ success: true, data: quotas } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/reset', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (userId) {
      const success = QuotaService.resetMonthlyQuota(userId);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        } as ApiResponse);
      }
      return res.json({ success: true, message: '额度重置成功' } as ApiResponse);
    }

    const count = QuotaService.resetAllQuotas();
    res.json({
      success: true,
      message: `已重置 ${count} 位用户的额度`
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/adjust', (req: Request, res: Response) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: userId, amount'
      } as ApiResponse);
    }
    const success = QuotaService.adjustQuota(userId, amount);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      } as ApiResponse);
    }
    res.json({
      success: true,
      message: `额度调整成功: ${amount > 0 ? '+' : ''}${amount}`
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
