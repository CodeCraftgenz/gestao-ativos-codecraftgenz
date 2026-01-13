import { Router, Request, Response, NextFunction } from 'express';
import * as adminService from '../admin/admin.service.js';

const router = Router();

// Rota publica - recebe snapshot do OverlayCraft (sem autenticacao)
router.post('/snapshot', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const snapshot = req.body;
    await adminService.receiveOverlayCraftSnapshot(snapshot);
    res.json({ success: true, message: 'Snapshot recebido com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Rota publica - health check do endpoint overlay
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'overlay-receiver',
    timestamp: new Date().toISOString()
  });
});

export default router;
