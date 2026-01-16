import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import { ValidationError } from '../../middleware/error.middleware.js';
import {
  loginRequestSchema,
  refreshTokenRequestSchema,
  changePasswordRequestSchema,
  registerRequestSchema,
} from './auth.dto.js';
import { login, refreshToken, changePassword, getCurrentUser, register } from './auth.service.js';

/**
 * POST /api/auth/login
 * Autentica um usuario admin
 */
export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = loginRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de login invalidos', errors);
    }

    const result = await login(parseResult.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Renova o access token usando refresh token
 */
export async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = refreshTokenRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Refresh token invalido', errors);
    }

    const result = await refreshToken(parseResult.data.refresh_token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Faz logout do usuario (apenas para auditoria, JWT e stateless)
 */
export async function logoutController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // JWT e stateless, entao logout e apenas simbólico
    // Em uma implementacao mais robusta, poderiamos manter uma blacklist de tokens

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Altera a senha do usuario autenticado
 */
export async function changePasswordController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('Usuario nao autenticado');
    }

    const parseResult = changePasswordRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados invalidos', errors);
    }

    await changePassword(req.user.id, parseResult.data);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retorna dados do usuario autenticado
 */
export async function meController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new ValidationError('Usuario nao autenticado');
    }

    const user = await getCurrentUser(req.user.id);

    if (!user) {
      throw new ValidationError('Usuario nao encontrado');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/register
 * Registra um novo usuario com plano
 */
export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = registerRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de registro invalidos', errors);
    }

    const result = await register(parseResult.data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado com sucesso',
    });
  } catch (error) {
    next(error);
  }
}
