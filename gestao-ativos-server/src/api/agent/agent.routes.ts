import { Router } from 'express';
import { agentAuthMiddleware } from '../../middleware/agentAuth.middleware.js';
import { agentRateLimiter, enrollmentRateLimiter } from '../../middleware/rateLimit.middleware.js';
import {
  enroll,
  getEnrollStatus,
  heartbeat,
  inventory,
  getCommands,
  postCommandResult,
  postEvents,
} from './agent.controller.js';

const router = Router();

// =============================================================================
// ROTAS PUBLICAS (sem autenticacao)
// =============================================================================

// POST /api/agent/enroll - Registra novo dispositivo
router.post('/enroll', enrollmentRateLimiter, enroll);

// GET /api/agent/enroll/status - Verifica status do enrollment
router.get('/enroll/status', enrollmentRateLimiter, getEnrollStatus);

// =============================================================================
// ROTAS AUTENTICADAS (requerem token do agente)
// =============================================================================

// POST /api/agent/heartbeat - Sinal de vida
router.post('/heartbeat', agentRateLimiter, agentAuthMiddleware, heartbeat);

// POST /api/agent/inventory - Envia inventario
router.post('/inventory', agentRateLimiter, agentAuthMiddleware, inventory);

// GET /api/agent/commands/pending - Busca comandos pendentes
router.get('/commands/pending', agentRateLimiter, agentAuthMiddleware, getCommands);

// POST /api/agent/commands/:commandId/result - Envia resultado de comando
router.post('/commands/:commandId/result', agentRateLimiter, agentAuthMiddleware, postCommandResult);

// POST /api/agent/events - Envia eventos/logs
router.post('/events', agentRateLimiter, agentAuthMiddleware, postEvents);

export default router;
