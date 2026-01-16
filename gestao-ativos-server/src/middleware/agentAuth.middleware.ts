import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, DeviceStatus } from '../types/index.js';
import { extractBearerToken, verifyAgentToken } from '../utils/token.util.js';
import { UnauthorizedError, DeviceBlockedError } from './error.middleware.js';
import { query, execute } from '../config/database.js';
import { hashAgentToken } from '../utils/hash.util.js';
import { logger } from '../config/logger.js';

interface DeviceRow {
  id: number;
  device_id: string;
  hostname: string;
  status: DeviceStatus;
  block_reason: string | null;
}

/**
 * Middleware de autenticacao para rotas do agente
 * Verifica o token JWT do agente e adiciona o device ao request
 */
export async function agentAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('Token nao fornecido', 'MISSING_TOKEN');
    }

    // Verifica o JWT
    const payload = verifyAgentToken(token);

    // Verifica se o token nao foi revogado e se o device existe
    const tokenHash = hashAgentToken(token);

    // Debug: Log para investigar problema de autenticação
    logger.debug('Agent auth attempt', {
      deviceInternalId: payload.sub,
      deviceId: payload.device_id,
      tokenHashPrefix: tokenHash.substring(0, 16) + '...',
    });

    const devices = await query<DeviceRow>(
      `SELECT d.id, d.device_id, d.hostname, d.status, d.block_reason
       FROM devices d
       INNER JOIN device_credentials dc ON dc.device_id = d.id
       WHERE d.id = ?
         AND d.device_id = ?
         AND dc.agent_token_hash = ?
         AND dc.revoked_at IS NULL`,
      [payload.sub, payload.device_id, tokenHash]
    );

    if (devices.length === 0) {
      // Debug: Verificar se existe credencial para este device
      const existingCreds = await query<{ agent_token_hash: string; revoked_at: string | null }>(
        `SELECT agent_token_hash, revoked_at FROM device_credentials WHERE device_id = ? ORDER BY id DESC LIMIT 3`,
        [payload.sub]
      );
      logger.warn('Agent auth failed - no matching credentials', {
        deviceInternalId: payload.sub,
        deviceId: payload.device_id,
        tokenHashPrefix: tokenHash.substring(0, 16) + '...',
        existingCreds: existingCreds.map(c => ({
          hashPrefix: c.agent_token_hash.substring(0, 16) + '...',
          revoked: c.revoked_at !== null,
        })),
      });
      throw new UnauthorizedError('Token revogado ou dispositivo nao encontrado', 'REVOKED_TOKEN');
    }

    const device = devices[0];

    // Verifica se o dispositivo nao esta bloqueado
    if (device.status === DeviceStatus.BLOCKED) {
      throw new DeviceBlockedError(device.block_reason ?? undefined);
    }

    // Verifica se o dispositivo foi aprovado
    if (device.status === DeviceStatus.PENDING) {
      throw new UnauthorizedError('Dispositivo aguardando aprovacao', 'PENDING_APPROVAL');
    }

    // Atualiza last_used_at do token
    await execute(
      `UPDATE device_credentials SET last_used_at = NOW() WHERE agent_token_hash = ?`,
      [tokenHash]
    );

    // Adiciona o device ao request
    req.device = {
      id: device.id,
      device_id: device.device_id,
      hostname: device.hostname,
      status: device.status,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof DeviceBlockedError) {
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

    next(new UnauthorizedError('Falha na autenticacao do agente', 'AUTH_FAILED'));
  }
}

/**
 * Middleware opcional que tenta autenticar mas nao falha se nao houver token
 * Util para rotas como enrollment/status que podem ou nao ter token
 */
export async function optionalAgentAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      // Sem token, continua sem autenticacao
      next();
      return;
    }

    // Tenta autenticar
    await agentAuthMiddleware(req, res, next);
  } catch {
    // Falha silenciosa - continua sem autenticacao
    next();
  }
}
