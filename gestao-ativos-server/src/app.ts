import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { logger, logRequest } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

// Rotas
import agentRoutes from './api/agent/agent.routes.js';
import authRoutes from './api/auth/auth.routes.js';
import adminRoutes from './api/admin/admin.routes.js';

export function createApp(): Express {
  const app = express();

  // ==========================================================================
  // MIDDLEWARES GLOBAIS
  // ==========================================================================

  // Segurança
  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
  }));

  // CORS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      const allowedOrigins = Array.isArray(config.cors.origin)
        ? config.cors.origin
        : [config.cors.origin];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compressão
  app.use(compression());

  // Parse JSON
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded
  app.use(express.urlencoded({ extended: true }));

  // Trust proxy (para rate limiting funcionar atras de reverse proxy)
  app.set('trust proxy', 1);

  // ==========================================================================
  // REQUEST LOGGING
  // ==========================================================================

  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logRequest(req.method, req.path, res.statusCode, duration, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  });

  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] || '1.0.0',
    });
  });

  // ==========================================================================
  // ROTAS DA API
  // ==========================================================================

  // Rotas do agente
  app.use('/api/agent', agentRoutes);

  // Rotas de autenticação
  app.use('/api/auth', authRoutes);

  // Rotas de admin
  app.use('/api/admin', adminRoutes);

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
