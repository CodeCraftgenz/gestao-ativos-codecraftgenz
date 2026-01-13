import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { insert } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Registra uma acao no log de auditoria
 */
export async function logAuditAction(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: string | number | null,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    await insert(
      `INSERT INTO audit_logs
        (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId?.toString() ?? null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    // Nao falhar a requisicao por erro de auditoria
    logger.error('Falha ao registrar log de auditoria', {
      error,
      action,
      entityType,
      entityId,
    });
  }
}

/**
 * Helper para criar middleware de auditoria automatica
 */
export function createAuditMiddleware(
  action: string,
  entityType: string,
  getEntityId: (req: AuthenticatedRequest) => string | number | null = (req) => req.params.id ?? null
) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Salva referencia ao metodo original send
    const originalSend = res.send.bind(res);

    // Intercepta a resposta
    res.send = function (body: unknown) {
      // Registra auditoria apenas para respostas de sucesso (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = getEntityId(req);
        const userId = req.user?.id ?? null;
        const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
        const userAgent = req.headers['user-agent'] ?? null;

        // Registra de forma assincrona (nao bloqueia a resposta)
        logAuditAction(
          userId,
          action,
          entityType,
          entityId,
          null, // oldValues - seria necessario carregar antes da operacao
          req.body ?? null,
          ipAddress,
          userAgent
        ).catch(() => {
          // Erro ja logado dentro da funcao
        });
      }

      return originalSend(body);
    };

    next();
  };
}

/**
 * Middleware de auditoria para aprovacao de dispositivo
 */
export const auditDeviceApproval = createAuditMiddleware('APPROVE_DEVICE', 'device');

/**
 * Middleware de auditoria para bloqueio de dispositivo
 */
export const auditDeviceBlock = createAuditMiddleware('BLOCK_DEVICE', 'device');

/**
 * Middleware de auditoria para envio de comando
 */
export const auditSendCommand = createAuditMiddleware('SEND_COMMAND', 'command');

/**
 * Middleware de auditoria para criacao de usuario
 */
export const auditCreateUser = createAuditMiddleware('CREATE_USER', 'user');

/**
 * Middleware de auditoria para exclusao de dispositivo
 */
export const auditDeleteDevice = createAuditMiddleware('DELETE_DEVICE', 'device');
