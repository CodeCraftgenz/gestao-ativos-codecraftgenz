import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRole } from '../types/index.js';

// =============================================================================
// TIPOS
// =============================================================================

export interface AdminTokenPayload {
  sub: number; // user id
  email: string;
  name: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AgentTokenPayload {
  sub: number; // device internal id
  device_id: string; // GUID do dispositivo
  hostname: string;
  type: 'agent' | 'agent_refresh';
  iat?: number;
  exp?: number;
}

// =============================================================================
// TOKENS DE ADMIN
// =============================================================================

/**
 * Gera um access token para admin
 */
export function generateAdminAccessToken(
  userId: number,
  email: string,
  name: string,
  role: UserRole
): string {
  const payload = {
    sub: userId,
    email,
    name,
    role,
    type: 'access' as const,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as unknown as number,
  });
}

/**
 * Gera um refresh token para admin
 */
export function generateAdminRefreshToken(
  userId: number,
  email: string,
  name: string,
  role: UserRole
): string {
  const payload = {
    sub: userId,
    email,
    name,
    role,
    type: 'refresh' as const,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as unknown as number,
  });
}

/**
 * Verifica e decodifica um access token de admin
 */
export function verifyAdminAccessToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret) as unknown as AdminTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Token type invalid');
  }

  return decoded;
}

/**
 * Verifica e decodifica um refresh token de admin
 */
export function verifyAdminRefreshToken(token: string): AdminTokenPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as unknown as AdminTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Token type invalid');
  }

  return decoded;
}

// =============================================================================
// TOKENS DE AGENTE
// =============================================================================

/**
 * Gera um access token para o agente
 */
export function generateAgentAccessToken(
  deviceInternalId: number,
  deviceId: string,
  hostname: string
): string {
  const payload = {
    sub: deviceInternalId,
    device_id: deviceId,
    hostname,
    type: 'agent' as const,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.agentToken.expiresIn as unknown as number,
  });
}

/**
 * Gera um refresh token para o agente
 */
export function generateAgentRefreshToken(
  deviceInternalId: number,
  deviceId: string,
  hostname: string
): string {
  const payload = {
    sub: deviceInternalId,
    device_id: deviceId,
    hostname,
    type: 'agent_refresh' as const,
  };

  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.agentToken.refreshExpiresIn as unknown as number,
  });
}

/**
 * Verifica e decodifica um token de agente
 */
export function verifyAgentToken(token: string): AgentTokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret) as unknown as AgentTokenPayload;

  if (decoded.type !== 'agent') {
    throw new Error('Token type invalid');
  }

  return decoded;
}

/**
 * Verifica e decodifica um refresh token de agente
 */
export function verifyAgentRefreshToken(token: string): AgentTokenPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as unknown as AgentTokenPayload;

  if (decoded.type !== 'agent_refresh') {
    throw new Error('Token type invalid');
  }

  return decoded;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extrai o token do header Authorization
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Decodifica um token sem verificar (para debugging)
 */
export function decodeToken(token: string): AdminTokenPayload | AgentTokenPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    return decoded as unknown as AdminTokenPayload | AgentTokenPayload;
  } catch {
    return null;
  }
}
