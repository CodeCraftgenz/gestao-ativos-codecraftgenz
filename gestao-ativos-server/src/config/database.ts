import mysql from 'mysql2/promise';
import { config } from './index.js';
import { logger } from './logger.js';

// Pool de conexoes MySQL
export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: config.database.pool.max,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Timezone
  timezone: '+00:00',
  // Tipos de data
  dateStrings: false,
  // Suporte a multiplas statements
  multipleStatements: false,
});

/**
 * Verifica a conexao com o banco de dados
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('Conexao com o banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    logger.error('Falha ao conectar com o banco de dados', { error });
    return false;
  }
}

/**
 * Executa uma query com parametros
 */
export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * Executa uma query que retorna um unico resultado
 */
export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Executa um INSERT e retorna o ID inserido
 */
export async function insert(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).insertId;
}

/**
 * Executa um UPDATE/DELETE e retorna o numero de linhas afetadas
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows;
}

/**
 * Executa multiplas queries em uma transacao
 */
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Fecha o pool de conexoes (para shutdown gracioso)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Pool de conexoes do banco de dados fechado');
}
