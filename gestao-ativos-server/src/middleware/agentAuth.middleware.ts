import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, DeviceStatus } from '../types/index.js';
import { extractBearerToken, verifyAgentToken, decodeToken } from '../utils/token.util.js';
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

interface CredentialRow {
  id: number;
  agent_token_hash: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Helper para extrair informacoes seguras de log do token
 * NAO expoe o token completo, apenas prefixo e sufixo
 */
function getSafeTokenInfo(token: string | null): { prefix: string; suffix: string; length: number } | null {
  if (!token || token.length < 20) return null;
  return {
    prefix: token.substring(0, 10),
    suffix: token.substring(token.length - 6),
    length: token.length,
  };
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
  // Extrai correlation-id do header ou gera um novo
  const correlationId = (req.headers['x-correlation-id'] as string) || `srv-${Date.now()}`;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const endpoint = req.path;

  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    // CENARIO 1: Token ausente
    if (!token) {
      logger.warn('Agent auth failed: MISSING_TOKEN', {
        correlationId,
        reason: 'missing_token',
        clientIp,
        userAgent,
        endpoint,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 20) || null,
      });
      throw new UnauthorizedError('Token nao fornecido', 'MISSING_TOKEN');
    }

    const safeTokenInfo = getSafeTokenInfo(token);

    // Tenta decodificar sem verificar para obter info de debug
    const decodedWithoutVerify = decodeToken(token);

    // CENARIO 2: JWT invalido ou expirado - verifyAgentToken lanca excecao
    let payload;
    try {
      payload = verifyAgentToken(token);
    } catch (jwtError) {
      const errorName = jwtError instanceof Error ? jwtError.name : 'UnknownError';
      const errorMsg = jwtError instanceof Error ? jwtError.message : String(jwtError);

      logger.warn('Agent auth failed: JWT verification error', {
        correlationId,
        reason: errorName === 'TokenExpiredError' ? 'jwt_expired' : 'jwt_invalid',
        clientIp,
        userAgent,
        endpoint,
        safeTokenInfo,
        jwtErrorName: errorName,
        jwtErrorMessage: errorMsg,
        decodedPayload: decodedWithoutVerify ? {
          sub: decodedWithoutVerify.sub,
          device_id: (decodedWithoutVerify as { device_id?: string }).device_id,
          type: (decodedWithoutVerify as { type?: string }).type,
          exp: (decodedWithoutVerify as { exp?: number }).exp,
          iat: (decodedWithoutVerify as { iat?: number }).iat,
        } : null,
      });
      throw jwtError; // Re-throw para ser tratado no catch externo
    }

    // Verifica se o token nao foi revogado e se o device existe
    const tokenHash = hashAgentToken(token);
    const hashPrefix = tokenHash.substring(0, 16);

    logger.debug('Agent auth attempt', {
      correlationId,
      deviceInternalId: payload.sub,
      deviceId: payload.device_id,
      hostname: payload.hostname,
      tokenHashPrefix: hashPrefix + '...',
      clientIp,
      endpoint,
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

    // CENARIO 3: Token nao encontrado no banco (revogado ou hash diferente)
    if (devices.length === 0) {
      // Busca credenciais existentes para diagnostico
      const existingCreds = await query<CredentialRow>(
        `SELECT id, agent_token_hash, revoked_at, revoke_reason, created_at, last_used_at
         FROM device_credentials
         WHERE device_id = ?
         ORDER BY id DESC
         LIMIT 5`,
        [payload.sub]
      );

      // Verifica se o device existe
      const deviceExists = await query<{ id: number; device_id: string; status: string }>(
        `SELECT id, device_id, status FROM devices WHERE id = ?`,
        [payload.sub]
      );

      // Determina a causa raiz
      let rootCause: string;
      let matchingCredential: CredentialRow | null = null;

      if (deviceExists.length === 0) {
        rootCause = 'device_not_found';
      } else if (existingCreds.length === 0) {
        rootCause = 'no_credentials_exist';
      } else {
        // Verifica se alguma credencial tem o mesmo hash
        matchingCredential = existingCreds.find(c => c.agent_token_hash === tokenHash) || null;

        if (matchingCredential) {
          if (matchingCredential.revoked_at) {
            rootCause = 'token_revoked';
          } else {
            rootCause = 'device_id_mismatch'; // Hash bate mas device_id nao
          }
        } else {
          rootCause = 'hash_mismatch';
        }
      }

      logger.warn('Agent auth failed: Token not found in database', {
        correlationId,
        reason: rootCause,
        deviceInternalId: payload.sub,
        deviceId: payload.device_id,
        tokenHashPrefix: hashPrefix + '...',
        clientIp,
        userAgent,
        endpoint,
        deviceExists: deviceExists.length > 0,
        deviceStatus: deviceExists[0]?.status || null,
        credentialsCount: existingCreds.length,
        credentials: existingCreds.map(c => ({
          id: c.id,
          hashPrefix: c.agent_token_hash.substring(0, 16) + '...',
          hashMatch: c.agent_token_hash === tokenHash,
          revoked: c.revoked_at !== null,
          revokeReason: c.revoke_reason,
          createdAt: c.created_at,
          lastUsedAt: c.last_used_at,
        })),
        matchingCredentialId: matchingCredential?.id || null,
      });

      throw new UnauthorizedError('Token revogado ou dispositivo nao encontrado', 'REVOKED_TOKEN');
    }

    const device = devices[0];

    // CENARIO 4: Device bloqueado
    if (device.status === DeviceStatus.BLOCKED) {
      logger.warn('Agent auth failed: Device blocked', {
        correlationId,
        reason: 'device_blocked',
        deviceInternalId: device.id,
        deviceId: device.device_id,
        hostname: device.hostname,
        blockReason: device.block_reason,
        clientIp,
        endpoint,
      });
      throw new DeviceBlockedError(device.block_reason ?? undefined);
    }

    // CENARIO 5: Device pendente de aprovacao
    if (device.status === DeviceStatus.PENDING) {
      logger.warn('Agent auth failed: Device pending approval', {
        correlationId,
        reason: 'device_pending',
        deviceInternalId: device.id,
        deviceId: device.device_id,
        hostname: device.hostname,
        clientIp,
        endpoint,
      });
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

    // Log de sucesso (debug level)
    logger.debug('Agent auth success', {
      correlationId,
      deviceInternalId: device.id,
      deviceId: device.device_id,
      hostname: device.hostname,
      endpoint,
    });

    next();
  } catch (error) {
    // Extrai correlation-id novamente pois pode nao estar no escopo
    const correlationId = (req.headers['x-correlation-id'] as string) || `srv-${Date.now()}`;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    if (error instanceof UnauthorizedError || error instanceof DeviceBlockedError) {
      next(error);
      return;
    }

    // Erros de JWT (ja logados acima, mas trata aqui para criar UnauthorizedError)
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        next(new UnauthorizedError('Token expirado', 'EXPIRED_TOKEN'));
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        next(new UnauthorizedError('Token invalido', 'INVALID_TOKEN'));
        return;
      }

      // Erro inesperado - loga detalhes
      logger.error('Agent auth unexpected error', {
        correlationId,
        reason: 'unexpected_error',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        clientIp,
        endpoint: req.path,
      });
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
