import dotenv from 'dotenv';
import path from 'path';

// Carrega variaveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Variavel de ambiente obrigatoria nao definida: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Variavel de ambiente ${key} deve ser um numero`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export const config = {
  // Ambiente
  env: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  isDevelopment: getEnvVar('NODE_ENV', 'development') === 'development',
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',

  // Database
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 3306),
    user: getEnvVar('DB_USER', 'root'),
    password: getEnvVar('DB_PASSWORD', ''),
    name: getEnvVar('DB_NAME', 'gestao_ativos'),
    pool: {
      min: getEnvNumber('DB_POOL_MIN', 2),
      max: getEnvNumber('DB_POOL_MAX', 10),
    },
  },

  // JWT
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '1h'),
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Agent tokens
  agentToken: {
    expiresIn: getEnvVar('AGENT_TOKEN_EXPIRES_IN', '30d'),
    refreshExpiresIn: getEnvVar('AGENT_REFRESH_TOKEN_EXPIRES_IN', '90d'),
  },

  // Rate limiting
  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutos
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  agentRateLimit: {
    windowMs: getEnvNumber('AGENT_RATE_LIMIT_WINDOW_MS', 60000), // 1 minuto
    maxRequests: getEnvNumber('AGENT_RATE_LIMIT_MAX_REQUESTS', 60),
  },

  // CORS
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174').split(','),
  },

  // Agent configuration
  agent: {
    heartbeatInterval: getEnvNumber('HEARTBEAT_INTERVAL', 60),
    heartbeatTimeout: getEnvNumber('HEARTBEAT_TIMEOUT', 180),
    inventoryInterval: getEnvNumber('INVENTORY_INTERVAL', 24),
    autoApproveDevices: getEnvBoolean('AUTO_APPROVE_DEVICES', false),
    minVersion: getEnvVar('AGENT_MIN_VERSION', '1.0.0'),
  },

  // Logging
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'json'),
    file: process.env['LOG_FILE'],
  },

  // Jobs
  jobs: {
    deviceStatusCron: getEnvVar('JOB_DEVICE_STATUS_CRON', '*/1 * * * *'),
    commandExpiryCron: getEnvVar('JOB_COMMAND_EXPIRY_CRON', '0 * * * *'),
    cleanupCron: getEnvVar('JOB_CLEANUP_CRON', '0 3 * * *'),
  },
} as const;

export type Config = typeof config;
