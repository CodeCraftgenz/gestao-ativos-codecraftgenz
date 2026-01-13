import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';
import { ApiResponse } from '../types/index.js';

// =============================================================================
// CUSTOM ERRORS
// =============================================================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} com ID ${id} nao encontrado`
      : `${resource} nao encontrado`;
    super(404, message, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Nao autorizado', code: string = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string[]) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(retryAfter: number = 60) {
    super(429, `Muitas requisicoes. Tente novamente em ${retryAfter} segundos`, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DeviceBlockedError extends AppError {
  constructor(reason?: string) {
    const message = reason
      ? `Dispositivo bloqueado: ${reason}`
      : 'Dispositivo bloqueado';
    super(403, message, 'DEVICE_BLOCKED');
  }
}

// =============================================================================
// ERROR HANDLER MIDDLEWARE
// =============================================================================

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log do erro
  logger.error(error.message, {
    error: error.name,
    stack: config.isDevelopment ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro do Zod (validacao)
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    const response: ApiResponse = {
      success: false,
      error: 'Dados invalidos',
      details,
    };
    res.status(400).json(response);
    return;
  }

  // Erro customizado da aplicacao
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
      details: error.details,
    };
    res.status(error.statusCode).json(response);
    return;
  }

  // Erro de JWT
  if (error.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token invalido',
    };
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token expirado',
    };
    res.status(401).json(response);
    return;
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    const response: ApiResponse = {
      success: false,
      error: 'JSON invalido no corpo da requisicao',
    };
    res.status(400).json(response);
    return;
  }

  // Erro generico (nao expor detalhes em producao)
  const response: ApiResponse = {
    success: false,
    error: config.isDevelopment
      ? error.message
      : 'Erro interno do servidor',
  };
  res.status(500).json(response);
}

// =============================================================================
// NOT FOUND HANDLER
// =============================================================================

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: `Rota ${req.method} ${req.path} nao encontrada`,
  };
  res.status(404).json(response);
}
