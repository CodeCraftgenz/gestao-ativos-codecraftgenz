import { Router, Response, NextFunction } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthenticatedRequest, PlanFeatures } from '../../types/index.js';
import * as adminController from './admin.controller.js';
import * as reportsController from './reports.controller.js';
import * as enterpriseController from './enterprise.controller.js';
import { hasFeature } from './enterprise.service.js';
import {
  auditDeviceApproval,
  auditDeviceBlock,
  auditSendCommand,
} from '../../middleware/audit.middleware.js';

const router = Router();

// Todas as rotas requerem autenticacao
router.use(authMiddleware);

// =============================================================================
// MIDDLEWARE DE VERIFICACAO DE FEATURE
// =============================================================================

/**
 * Cria middleware que verifica se o usuario tem acesso a uma feature especifica
 */
function requireFeature(feature: keyof PlanFeatures) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const hasAccess = await hasFeature(userId, feature);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: `Este recurso requer o plano Empresarial. Faca upgrade para acessar.`,
          requiredFeature: feature,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

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

// SSO (Single Sign-On)
router.get('/sso', enterpriseController.getSSOConfig);
router.post('/sso', enterpriseController.createSSOConfig);
router.put('/sso', enterpriseController.updateSSOConfig);
router.delete('/sso', enterpriseController.deleteSSOConfig);

// Webhooks
router.get('/webhooks', enterpriseController.getWebhooks);
router.get('/webhooks/:id', enterpriseController.getWebhookById);
router.post('/webhooks', enterpriseController.createWebhook);
router.put('/webhooks/:id', enterpriseController.updateWebhook);
router.delete('/webhooks/:id', enterpriseController.deleteWebhook);
router.get('/webhooks/:id/logs', enterpriseController.getWebhookLogs);
router.post('/webhooks/:id/test', enterpriseController.testWebhook);

// White-Label (Branding)
router.get('/branding', enterpriseController.getBranding);
router.put('/branding', enterpriseController.updateBranding);
router.delete('/branding', enterpriseController.deleteBranding);

// API Tokens
router.get('/api-tokens', enterpriseController.getApiTokens);
router.post('/api-tokens', enterpriseController.createApiToken);
router.delete('/api-tokens/:id', enterpriseController.revokeApiToken);

export default router;
