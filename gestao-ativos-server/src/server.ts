import { createApp } from './app.js';
import { config } from './config/index.js';
import { checkDatabaseConnection, closePool } from './config/database.js';
import { logger } from './config/logger.js';

async function startServer(): Promise<void> {
  logger.info('Iniciando Gestao de Ativos Server...', {
    env: config.env,
    port: config.port,
  });

  // Verifica conexão com o banco de dados
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    logger.error('Nao foi possivel conectar ao banco de dados. Encerrando...');
    process.exit(1);
  }

  // Cria a aplicação Express
  const app = createApp();

  // Inicia o servidor HTTP
  const server = app.listen(config.port, () => {
    logger.info(`Servidor rodando em http://localhost:${config.port}`, {
      env: config.env,
    });
  });

  // ==========================================================================
  // GRACEFUL SHUTDOWN
  // ==========================================================================

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Recebido ${signal}. Iniciando shutdown gracioso...`);

    // Para de aceitar novas conexões
    server.close(async () => {
      logger.info('Servidor HTTP fechado');

      // Fecha pool de conexões do banco
      await closePool();

      logger.info('Shutdown completo');
      process.exit(0);
    });

    // Força shutdown após 30 segundos
    setTimeout(() => {
      logger.error('Shutdown forcado apos timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ==========================================================================
  // UNCAUGHT EXCEPTIONS
  // ==========================================================================

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
  });
}

// Inicia o servidor
startServer().catch((error) => {
  logger.error('Falha ao iniciar servidor', { error: error.message });
  process.exit(1);
});
