import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as adminController from './admin.controller.js';

const router = Router();

// Todas as rotas requerem autenticacao
router.use(authMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getStats);

// Devices
router.get('/devices', adminController.getDevices);
router.get('/devices/pending', adminController.getPendingDevices);
router.get('/devices/pre-registered', adminController.getPreRegisteredDevices);
router.get('/devices/service-tag/:serviceTag', adminController.getDeviceByServiceTag);
router.get('/devices/:id', adminController.getDeviceById);
router.get('/devices/:id/realtime', adminController.getRealTimeData);
router.get('/devices/:id/realtime-cached', adminController.getRealTimeDataFromCache);
router.post('/devices/:id/approve', adminController.approveDevice);
router.post('/devices/:id/block', adminController.blockDevice);
router.post('/devices/:id/unblock', adminController.unblockDevice);
router.post('/devices/:id/command', adminController.sendCommand);
router.post('/devices/register-by-service-tag', adminController.registerByServiceTag);

// Snapshots (dados em tempo real do OverlayCraft)
router.get('/snapshots', adminController.getActiveSnapshots);
router.get('/snapshots/:serviceTag', adminController.getSnapshotByServiceTag);

export default router;
