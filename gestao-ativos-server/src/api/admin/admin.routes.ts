import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as adminController from './admin.controller.js';
import * as reportsController from './reports.controller.js';

const router = Router();

// Todas as rotas requerem autenticacao
router.use(authMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getStats);
router.get('/dashboard/analytics', adminController.getDashboardAnalytics);

// Devices
router.get('/devices', adminController.getDevices);
router.get('/devices/pending', adminController.getPendingDevices);
router.get('/devices/pre-registered', adminController.getPreRegisteredDevices);
router.get('/devices/service-tag/:serviceTag', adminController.getDeviceByServiceTag);
router.get('/devices/:id', adminController.getDeviceById);
router.post('/devices/:id/approve', adminController.approveDevice);
router.post('/devices/:id/block', adminController.blockDevice);
router.post('/devices/:id/unblock', adminController.unblockDevice);
router.post('/devices/:id/command', adminController.sendCommand);
router.post('/devices/register-by-service-tag', adminController.registerByServiceTag);

// LGPD
router.get('/lgpd/status', adminController.getLGPDCleanupStatus);
router.post('/lgpd/cleanup', adminController.executeLGPDCleanup);
router.get('/lgpd/export', adminController.exportLGPDDataEndpoint);

// Planos e Subscriptions
router.get('/plans', adminController.getPlans);
router.get('/plans/:id', adminController.getPlanById);
router.get('/subscription', adminController.getMySubscription);
router.put('/subscription', adminController.updateMyPlan);
router.delete('/subscription', adminController.cancelMySubscription);

// Relatorios - Visualizacao
router.get('/reports/uptime', reportsController.getUptimeReport);
router.get('/reports/activity', reportsController.getActivityReport);
router.get('/reports/usage', reportsController.getUsageReport);
router.get('/reports/idle', reportsController.getIdleReport);
router.get('/reports/users', reportsController.getUsersReport);
router.get('/reports/inventory', reportsController.getInventoryReport);
router.get('/reports/growth', reportsController.getGrowthReport);

// Relatorios - Exportacao CSV
router.get('/reports/uptime/export', reportsController.exportUptimeCSV);
router.get('/reports/activity/export', reportsController.exportActivityCSV);
router.get('/reports/usage/export', reportsController.exportUsageCSV);
router.get('/reports/idle/export', reportsController.exportIdleCSV);
router.get('/reports/users/export', reportsController.exportUsersCSV);
router.get('/reports/inventory/export', reportsController.exportInventoryCSV);
router.get('/reports/growth/export', reportsController.exportGrowthCSV);

export default router;
