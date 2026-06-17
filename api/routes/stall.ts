import { Router, Request, Response } from 'express';
import { StallService } from '../services/stall.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const stalls = StallService.getAllStalls();
    res.json({ success: true, data: stalls } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/:stallId', (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const stall = StallService.getStallById(stallId);
    if (!stall) {
      return res.status(404).json({
        success: false,
        error: '档口不存在'
      } as ApiResponse);
    }
    res.json({ success: true, data: stall } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/:stallId/menu', (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const menu = StallService.getMenuItems(stallId);
    res.json({ success: true, data: menu } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/menu/all', (req: Request, res: Response) => {
  try {
    const menu = StallService.getAllMenuItems();
    res.json({ success: true, data: menu } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
