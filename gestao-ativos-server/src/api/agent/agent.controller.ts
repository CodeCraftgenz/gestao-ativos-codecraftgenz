import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import {
  enrollRequestSchema,
  heartbeatRequestSchema,
  inventoryRequestSchema,
  commandResultRequestSchema,
  eventsRequestSchema,
  snapshotRequestSchema,
  activityEventsRequestSchema,
} from './agent.dto.js';
import {
  enrollDevice,
  getEnrollmentStatus,
  processHeartbeat,
  processInventory,
  getPendingCommands,
  saveCommandResult,
  saveEvents,
  processSnapshot,
  processActivityEvents,
} from './agent.service.js';
import { ValidationError } from '../../middleware/error.middleware.js';

// =============================================================================
// ENROLLMENT
// =============================================================================

/**
 * POST /api/agent/enroll
 * Registra um novo dispositivo ou re-registra um existente
 */
export async function enroll(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = enrollRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      console.log('Enrollment validation errors:', errors); console.log('Request body:', JSON.stringify(req.body, null, 2)); throw new ValidationError('Dados de enrollment invalidos', errors);
    }

    const result = await enrollDevice(parseResult.data);

    const statusCode = result.status === 'pending' ? 202 : 200;
    res.status(statusCode).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/agent/enroll/status
 * Verifica o status de um enrollment pendente
 */
export async function getEnrollStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deviceId = req.query.device_id as string;

    if (!deviceId) {
      throw new ValidationError('device_id e obrigatorio');
    }

    const result = await getEnrollmentStatus(deviceId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// HEARTBEAT
// =============================================================================

/**
 * POST /api/agent/heartbeat
 * Recebe sinal de vida do agente
 */
export async function heartbeat(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const parseResult = heartbeatRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de heartbeat invalidos', errors);
    }

    // Extrai IP do cliente
    const clientIp = req.ip || req.socket.remoteAddress || undefined;

    const result = await processHeartbeat(req.device.id, parseResult.data, clientIp);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// INVENTORY
// =============================================================================

/**
 * POST /api/agent/inventory
 * Recebe inventario completo do dispositivo
 */
export async function inventory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const parseResult = inventoryRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de inventario invalidos', errors);
    }

    const result = await processInventory(req.device.id, parseResult.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * GET /api/agent/commands/pending
 * Retorna comandos pendentes para o dispositivo
 */
export async function getCommands(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const commands = await getPendingCommands(req.device.id);

    res.json({
      success: true,
      data: { commands },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/agent/commands/:commandId/result
 * Recebe resultado de um comando executado
 */
export async function postCommandResult(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const commandId = parseInt(req.params.commandId, 10);

    if (isNaN(commandId)) {
      throw new ValidationError('commandId invalido');
    }

    const parseResult = commandResultRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de resultado invalidos', errors);
    }

    await saveCommandResult(req.device.id, commandId, parseResult.data);

    res.json({
      success: true,
      message: 'Resultado registrado com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * POST /api/agent/events
 * Recebe eventos/logs do agente
 */
export async function postEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const parseResult = eventsRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de eventos invalidos', errors);
    }

    const received = await saveEvents(req.device.id, parseResult.data);

    res.json({
      success: true,
      data: { received },
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// SNAPSHOT (Tempo Real)
// =============================================================================

/**
 * POST /api/agent/snapshot
 * Recebe snapshot em tempo real do dispositivo
 */
export async function snapshot(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const parseResult = snapshotRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de snapshot invalidos', errors);
    }

    const result = await processSnapshot(req.device.id, parseResult.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// ACTIVITY EVENTS (BOOT/SHUTDOWN/LOGIN/LOGOUT)
// =============================================================================

/**
 * POST /api/agent/activity
 * Recebe eventos de atividade (boot, shutdown, login, logout)
 * ENDPOINT PRINCIPAL para o Patio de Controle
 */
export async function activityEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.device) {
      throw new ValidationError('Dispositivo nao autenticado');
    }

    const parseResult = activityEventsRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError('Dados de eventos de atividade invalidos', errors);
    }

    // Extrai IP do cliente
    const clientIp = req.ip || req.socket.remoteAddress || undefined;

    const result = await processActivityEvents(req.device.id, parseResult.data, clientIp);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
