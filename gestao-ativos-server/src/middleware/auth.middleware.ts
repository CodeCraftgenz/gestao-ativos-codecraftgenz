import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { extractBearerToken, verifyAdminAccessToken } from '../utils/token.util.js';
import { UnauthorizedError, ForbiddenError } from './error.middleware.js';

/**
 * Middleware de autenticacao para rotas de admin
 * Verifica o token JWT e adiciona o usuario ao request
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('Token nao fornecido', 'MISSING_TOKEN');
    }

    const payload = verifyAdminAccessToken(token);

    // Adiciona o usuario ao request
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    // Erros de JWT
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        next(new UnauthorizedError('Token expirado', 'EXPIRED_TOKEN'));
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        next(new UnauthorizedError('Token invalido', 'INVALID_TOKEN'));
        return;
      }
    }

    next(new UnauthorizedError('Falha na autenticacao', 'AUTH_FAILED'));
  }
}

/**
 * Middleware de autorizacao por roles
 * Deve ser usado apos authMiddleware
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Usuario nao autenticado'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Voce nao tem permissao para esta acao'));
      return;
    }

    next();
  };
}

/**
 * Middleware que exige role ADMIN
 */
export const requireAdmin = requireRoles(UserRole.ADMIN);

/**
 * Middleware que exige role ADMIN ou OPERADOR
 */
export const requireOperator = requireRoles(UserRole.ADMIN, UserRole.OPERADOR);

/**
 * Middleware que permite qualquer role autenticado
 */
export const requireAnyRole = requireRoles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.LEITURA);
