import { Router } from 'express';
import { authMiddleware, requireFeature } from '../../middleware/auth.middleware.js';
import * as adminController from './admin.controller.js';
import * as reportsController from './reports.controller.js';
import * as enterpriseController from './enterprise.controller.js';
import {
  auditDeviceApproval,
  auditDeviceBlock,
  auditSendCommand,
} from '../../middleware/audit.middleware.js';

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
// Rotas de escrita com middleware de auditoria
router.post('/devices/:id/approve', auditDeviceApproval, adminController.approveDevice);
router.post('/devices/:id/block', auditDeviceBlock, adminController.blockDevice);
router.post('/devices/:id/unblock', auditDeviceBlock, adminController.unblockDevice);
router.post('/devices/:id/command', auditSendCommand, adminController.sendCommand);
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

// Entitlements (features e quotas do plano atual)
router.get('/entitlements', adminController.getEntitlements);

// Relatorios - Visualizacao (requer feature reports)
router.get('/reports/uptime', requireFeature('reports'), reportsController.getUptimeReport);
router.get('/reports/activity', requireFeature('reports'), reportsController.getActivityReport);
router.get('/reports/usage', requireFeature('reports'), reportsController.getUsageReport);
router.get('/reports/idle', requireFeature('reports'), reportsController.getIdleReport);
router.get('/reports/users', requireFeature('reports'), reportsController.getUsersReport);
router.get('/reports/inventory', requireFeature('reports'), reportsController.getInventoryReport);
router.get('/reports/growth', requireFeature('reports'), reportsController.getGrowthReport);

// Relatorios - Exportacao CSV (requer feature reports)
router.get('/reports/uptime/export', requireFeature('reports'), reportsController.exportUptimeCSV);
router.get('/reports/activity/export', requireFeature('reports'), reportsController.exportActivityCSV);
router.get('/reports/usage/export', requireFeature('reports'), reportsController.exportUsageCSV);
router.get('/reports/idle/export', requireFeature('reports'), reportsController.exportIdleCSV);
router.get('/reports/users/export', requireFeature('reports'), reportsController.exportUsersCSV);
router.get('/reports/inventory/export', requireFeature('reports'), reportsController.exportInventoryCSV);
router.get('/reports/growth/export', requireFeature('reports'), reportsController.exportGrowthCSV);

// =============================================================================
// LOGS DE AUDITORIA (requer feature audit_logs)
// =============================================================================

router.get('/audit-logs', requireFeature('audit_logs'), adminController.getAuditLogs);
router.get('/audit-logs/actions', requireFeature('audit_logs'), adminController.getAuditLogActions);
router.get('/audit-logs/entity-types', requireFeature('audit_logs'), adminController.getAuditLogEntityTypes);

// =============================================================================
// ENTERPRISE FEATURES
// =============================================================================

// Plan Features
router.get('/features', enterpriseController.getPlanFeatures);

// SSO (Single Sign-On) - requer feature sso_enabled
router.get('/sso', requireFeature('sso_enabled'), enterpriseController.getSSOConfig);
router.post('/sso', requireFeature('sso_enabled'), enterpriseController.createSSOConfig);
router.put('/sso', requireFeature('sso_enabled'), enterpriseController.updateSSOConfig);
router.delete('/sso', requireFeature('sso_enabled'), enterpriseController.deleteSSOConfig);

// Webhooks - requer feature webhooks
router.get('/webhooks', requireFeature('webhooks'), enterpriseController.getWebhooks);
router.get('/webhooks/:id', requireFeature('webhooks'), enterpriseController.getWebhookById);
router.post('/webhooks', requireFeature('webhooks'), enterpriseController.createWebhook);
router.put('/webhooks/:id', requireFeature('webhooks'), enterpriseController.updateWebhook);
router.delete('/webhooks/:id', requireFeature('webhooks'), enterpriseController.deleteWebhook);
router.get('/webhooks/:id/logs', requireFeature('webhooks'), enterpriseController.getWebhookLogs);
router.post('/webhooks/:id/test', requireFeature('webhooks'), enterpriseController.testWebhook);

// White-Label (Branding) - requer feature white_label
router.get('/branding', requireFeature('white_label'), enterpriseController.getBranding);
router.put('/branding', requireFeature('white_label'), enterpriseController.updateBranding);
router.delete('/branding', requireFeature('white_label'), enterpriseController.deleteBranding);

// API Tokens - requer feature api_access
router.get('/api-tokens', requireFeature('api_access'), enterpriseController.getApiTokens);
router.post('/api-tokens', requireFeature('api_access'), enterpriseController.createApiToken);
router.delete('/api-tokens/:id', requireFeature('api_access'), enterpriseController.revokeApiToken);

export default router;
