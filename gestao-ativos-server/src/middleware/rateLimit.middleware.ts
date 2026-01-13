import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { TooManyRequestsError } from './error.middleware.js';

/**
 * Rate limiter para rotas de admin
 */
export const adminRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Muitas requisicoes. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new TooManyRequestsError(Math.ceil(config.rateLimit.windowMs / 1000)));
  },
});

/**
 * Rate limiter para rotas do agente (mais permissivo)
 */
export const agentRateLimiter = rateLimit({
  windowMs: config.agentRateLimit.windowMs,
  max: config.agentRateLimit.maxRequests,
  message: { success: false, error: 'Muitas requisicoes do agente.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usa o device_id como chave se disponivel, senao usa IP
    return req.body?.device_id || req.ip || 'unknown';
  },
  handler: (req, res, next) => {
    next(new TooManyRequestsError(Math.ceil(config.agentRateLimit.windowMs / 1000)));
  },
});

/**
 * Rate limiter para login (mais restritivo para evitar brute force)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new TooManyRequestsError(900)); // 15 minutos
  },
});

/**
 * Rate limiter para enrollment (evitar spam de registros)
 */
export const enrollmentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 3 tentativas por minuto
  message: { success: false, error: 'Muitas tentativas de registro.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usa combinacao de IP + device_id
    const deviceId = req.body?.device_id || '';
    return `${req.ip}-${deviceId}`;
  },
  handler: (req, res, next) => {
    next(new TooManyRequestsError(60));
  },
});
