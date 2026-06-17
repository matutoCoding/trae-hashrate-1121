import { Router, Request, Response } from 'express';
import { QueueService } from '../services/queue.js';
import type { CreateOrderRequest, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const stallId = req.query.stallId as string | undefined;
    const queue = QueueService.getQueue(stallId);
    const stats = QueueService.getQueueStats(stallId);
    res.json({ success: true, data: { queue, stats } } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/stats', (req: Request, res: Response) => {
  try {
    const stallId = req.query.stallId as string | undefined;
    const stats = QueueService.getQueueStats(stallId);
    res.json({ success: true, data: stats } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/ticket', (req: Request, res: Response) => {
  try {
    const request = req.body as CreateOrderRequest;
    if (!request.userId || !request.stallId || !request.items || request.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数: userId, stallId, items'
      } as ApiResponse);
    }
    const order = QueueService.createOrder(request);
    res.json({ success: true, data: order, message: '取号成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/call', (req: Request, res: Response) => {
  try {
    const { stallId } = req.body;
    if (!stallId) {
      return res.status(400).json({
        success: false,
        error: '缺少 stallId 参数'
      } as ApiResponse);
    }
    const order = QueueService.callNextOrder(stallId);
    if (!order) {
      return res.json({
        success: false,
        message: '当前没有待叫号的订单或正在叫号中'
      } as ApiResponse);
    }
    res.json({ success: true, data: order, message: '叫号成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/complete', (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '缺少 orderId 参数'
      } as ApiResponse);
    }
    const order = QueueService.completeOrder(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      } as ApiResponse);
    }
    res.json({ success: true, data: order, message: '取餐完成' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.post('/cancel', (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: '缺少 orderId 参数'
      } as ApiResponse);
    }
    const success = QueueService.cancelOrder(orderId);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: '订单不存在或已完成'
      } as ApiResponse);
    }
    res.json({ success: true, message: '订单已取消' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/order/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = QueueService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      } as ApiResponse);
    }
    res.json({ success: true, data: order } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const orders = QueueService.getUserOrders(userId, limit);
    res.json({ success: true, data: orders } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message } as ApiResponse);
  }
});

export default router;
