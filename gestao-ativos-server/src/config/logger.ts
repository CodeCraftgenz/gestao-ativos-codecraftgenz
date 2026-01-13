import winston from 'winston';
import { config } from './index.js';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Formato para desenvolvimento (mais legivel)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Configuracao dos transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: config.isDevelopment
      ? combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          devFormat
        )
      : combine(
          timestamp(),
          errors({ stack: true }),
          json()
        ),
  }),
];

// Adiciona arquivo de log se configurado
if (config.logging.file) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      ),
    })
  );
}

// Cria o logger
export const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'gestao-ativos-server' },
  transports,
});

// Funcoes helper para logging estruturado
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  logger.info('HTTP Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...metadata,
  });
}

export function logAgentActivity(
  deviceId: string,
  action: string,
  metadata?: Record<string, unknown>
): void {
  logger.info('Agent Activity', {
    deviceId,
    action,
    ...metadata,
  });
}

export function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: string | number | null,
  metadata?: Record<string, unknown>
): void {
  logger.info('Audit Log', {
    userId,
    action,
    entityType,
    entityId,
    ...metadata,
  });
}

export function logError(
  error: Error,
  context?: string,
  metadata?: Record<string, unknown>
): void {
  logger.error(error.message, {
    context,
    stack: error.stack,
    ...metadata,
  });
}
