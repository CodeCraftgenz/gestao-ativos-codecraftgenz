import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { loginRateLimiter, adminRateLimiter } from '../../middleware/rateLimit.middleware.js';
import {
  loginController,
  refreshTokenController,
  logoutController,
  changePasswordController,
  meController,
} from './auth.controller.js';

const router = Router();

// =============================================================================
// ROTAS PUBLICAS
// =============================================================================

// POST /api/auth/login - Login
router.post('/login', loginRateLimiter, loginController);

// POST /api/auth/refresh - Renovar token
router.post('/refresh', adminRateLimiter, refreshTokenController);

// =============================================================================
// ROTAS AUTENTICADAS
// =============================================================================

// POST /api/auth/logout - Logout
router.post('/logout', authMiddleware, logoutController);

// POST /api/auth/change-password - Alterar senha
router.post('/change-password', authMiddleware, changePasswordController);

// GET /api/auth/me - Dados do usuario atual
router.get('/me', authMiddleware, meController);

export default router;
