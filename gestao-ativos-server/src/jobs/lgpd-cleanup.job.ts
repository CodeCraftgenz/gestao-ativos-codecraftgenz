import { query, queryOne, execute } from '../config/database.js';
import { logger } from '../config/logger.js';
import { deleteScreenshotFile } from '../config/upload.js';

// =============================================================================
// CONFIGURACAO LGPD
// =============================================================================

interface LGPDConfig {
  heartbeat_retention_days: number;     // Heartbeats detalhados
  snapshot_retention_days: number;      // Snapshots de tempo real
  screenshot_retention_days: number;    // Screenshots de auditoria
  activity_retention_days: number;      // Eventos de atividade (boot/shutdown/login)
  ip_anonymize_after_days: number;      // Anonimizar IP
  user_anonymize_after_days: number;    // Anonimizar usuario
}

const DEFAULT_LGPD_CONFIG: LGPDConfig = {
  heartbeat_retention_days: 90,         // 3 meses
  snapshot_retention_days: 30,          // 1 mes
  screenshot_retention_days: 30,        // 1 mes (screenshots sao dados sensiveis)
  activity_retention_days: 365,         // 1 ano
  ip_anonymize_after_days: 30,          // 1 mes (reduzido de 180)
  user_anonymize_after_days: 90,        // 3 meses (reduzido de 730)
};

// =============================================================================
// FUNCOES DE LIMPEZA
// =============================================================================

interface CleanupResult {
  table: string;
  deleted: number;
  anonymized?: number;
  error?: string;
}

/**
 * Remove heartbeats antigos baseado no plano do dispositivo
 * LGPD Compliance: Respeita data_retention_days individual de cada usuario
 */
async function cleanupHeartbeats(retentionDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `DELETE FROM device_heartbeats
       WHERE received_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} heartbeats removidos (> ${retentionDays} dias)`);

    return { table: 'device_heartbeats', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar heartbeats', { error: errorMsg });
    return { table: 'device_heartbeats', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove heartbeats antigos respeitando o plano de cada usuario
 * LGPD Compliance: Cada usuario tem seu proprio data_retention_days
 */
async function cleanupHeartbeatsByUser(userRetentionMap: Map<number, number>): Promise<CleanupResult> {
  let totalDeleted = 0;

  try {
    // Para usuarios sem subscription ativa, usa retencao padrao (7 dias - plano gratuito)
    const defaultRetention = DEFAULT_LGPD_CONFIG.heartbeat_retention_days;

    // Remove heartbeats de dispositivos de usuarios sem subscription
    const orphanResult = await execute(
      `DELETE dh FROM device_heartbeats dh
       INNER JOIN devices d ON dh.device_id = d.id
       WHERE d.user_id NOT IN (
         SELECT user_id FROM subscriptions WHERE status = 'active'
       )
       AND dh.received_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [defaultRetention]
    );
    totalDeleted += (orphanResult as { affectedRows?: number })?.affectedRows ?? 0;

    // Remove heartbeats para cada usuario respeitando seu plano
    for (const [userId, retentionDays] of userRetentionMap) {
      const result = await execute(
        `DELETE dh FROM device_heartbeats dh
         INNER JOIN devices d ON dh.device_id = d.id
         WHERE d.user_id = ?
         AND dh.received_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, retentionDays]
      );
      totalDeleted += (result as { affectedRows?: number })?.affectedRows ?? 0;
    }

    logger.info(`LGPD Cleanup: ${totalDeleted} heartbeats removidos (por usuario)`);
    return { table: 'device_heartbeats', deleted: totalDeleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar heartbeats por usuario', { error: errorMsg });
    return { table: 'device_heartbeats', deleted: totalDeleted, error: errorMsg };
  }
}

/**
 * Remove snapshots antigos
 */
async function cleanupSnapshots(retentionDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `DELETE FROM device_snapshots
       WHERE collected_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} snapshots removidos (> ${retentionDays} dias)`);

    return { table: 'device_snapshots', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar snapshots', { error: errorMsg });
    return { table: 'device_snapshots', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove snapshots antigos respeitando o plano de cada usuario
 * LGPD Compliance: Cada usuario tem seu proprio data_retention_days
 */
async function cleanupSnapshotsByUser(userRetentionMap: Map<number, number>): Promise<CleanupResult> {
  let totalDeleted = 0;

  try {
    const defaultRetention = Math.min(30, DEFAULT_LGPD_CONFIG.snapshot_retention_days);

    // Remove snapshots de dispositivos de usuarios sem subscription
    const orphanResult = await execute(
      `DELETE ds FROM device_snapshots ds
       INNER JOIN devices d ON ds.device_id = d.id
       WHERE d.user_id NOT IN (
         SELECT user_id FROM subscriptions WHERE status = 'active'
       )
       AND ds.collected_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [defaultRetention]
    );
    totalDeleted += (orphanResult as { affectedRows?: number })?.affectedRows ?? 0;

    // Remove snapshots para cada usuario respeitando seu plano
    for (const [userId, retentionDays] of userRetentionMap) {
      // Snapshots tem retencao menor (max 30 dias ou o valor do plano, o que for menor)
      const snapshotRetention = Math.min(30, retentionDays);
      const result = await execute(
        `DELETE ds FROM device_snapshots ds
         INNER JOIN devices d ON ds.device_id = d.id
         WHERE d.user_id = ?
         AND ds.collected_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, snapshotRetention]
      );
      totalDeleted += (result as { affectedRows?: number })?.affectedRows ?? 0;
    }

    logger.info(`LGPD Cleanup: ${totalDeleted} snapshots removidos (por usuario)`);
    return { table: 'device_snapshots', deleted: totalDeleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar snapshots por usuario', { error: errorMsg });
    return { table: 'device_snapshots', deleted: totalDeleted, error: errorMsg };
  }
}

/**
 * Remove screenshots antigos e seus arquivos do disco
 * LGPD Compliance: Remove dados sensiveis (capturas de tela) apos periodo de retencao
 */
async function cleanupScreenshots(retentionDays: number): Promise<CleanupResult> {
  try {
    // Primeiro, busca os caminhos dos arquivos a serem removidos
    const screenshotsToDelete = await query<{ id: number; storage_path: string }>(
      `SELECT id, storage_path FROM device_screenshots
       WHERE captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    let filesDeleted = 0;
    let dbDeleted = 0;

    if (screenshotsToDelete && Array.isArray(screenshotsToDelete)) {
      // Remove arquivos do disco
      for (const screenshot of screenshotsToDelete) {
        try {
          deleteScreenshotFile(screenshot.storage_path);
          filesDeleted++;
        } catch (fileError) {
          logger.warn(`LGPD Cleanup: Falha ao remover arquivo de screenshot: ${screenshot.storage_path}`);
        }
      }

      // Remove registros do banco
      const result = await execute(
        `DELETE FROM device_screenshots
         WHERE captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [retentionDays]
      );
      dbDeleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    }

    logger.info(`LGPD Cleanup: ${dbDeleted} screenshots removidos (${filesDeleted} arquivos deletados) (> ${retentionDays} dias)`);
    return { table: 'device_screenshots', deleted: dbDeleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar screenshots', { error: errorMsg });
    return { table: 'device_screenshots', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove screenshots antigos respeitando o plano de cada usuario
 * LGPD Compliance: Cada usuario tem seu proprio data_retention_days
 */
async function cleanupScreenshotsByUser(userRetentionMap: Map<number, number>): Promise<CleanupResult> {
  let totalDeleted = 0;
  let totalFilesDeleted = 0;

  try {
    const defaultRetention = Math.min(30, DEFAULT_LGPD_CONFIG.screenshot_retention_days);

    // Remove screenshots de dispositivos de usuarios sem subscription
    const orphanScreenshots = await query<{ id: number; storage_path: string }>(
      `SELECT ds.id, ds.storage_path FROM device_screenshots ds
       WHERE ds.user_id NOT IN (
         SELECT user_id FROM subscriptions WHERE status = 'active'
       )
       AND ds.captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [defaultRetention]
    );

    if (orphanScreenshots && Array.isArray(orphanScreenshots)) {
      for (const screenshot of orphanScreenshots) {
        try {
          deleteScreenshotFile(screenshot.storage_path);
          totalFilesDeleted++;
        } catch {
          // Ignora erros de arquivo individual
        }
      }

      const orphanResult = await execute(
        `DELETE ds FROM device_screenshots ds
         WHERE ds.user_id NOT IN (
           SELECT user_id FROM subscriptions WHERE status = 'active'
         )
         AND ds.captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [defaultRetention]
      );
      totalDeleted += (orphanResult as { affectedRows?: number })?.affectedRows ?? 0;
    }

    // Remove screenshots para cada usuario respeitando seu plano
    for (const [userId, retentionDays] of userRetentionMap) {
      // Screenshots tem retencao menor (max 30 dias ou o valor do plano, o que for menor)
      const screenshotRetention = Math.min(30, retentionDays);

      // Busca arquivos a remover
      const userScreenshots = await query<{ id: number; storage_path: string }>(
        `SELECT id, storage_path FROM device_screenshots
         WHERE user_id = ?
         AND captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, screenshotRetention]
      );

      if (userScreenshots && Array.isArray(userScreenshots)) {
        for (const screenshot of userScreenshots) {
          try {
            deleteScreenshotFile(screenshot.storage_path);
            totalFilesDeleted++;
          } catch {
            // Ignora erros de arquivo individual
          }
        }
      }

      const result = await execute(
        `DELETE FROM device_screenshots
         WHERE user_id = ?
         AND captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [userId, screenshotRetention]
      );
      totalDeleted += (result as { affectedRows?: number })?.affectedRows ?? 0;
    }

    logger.info(`LGPD Cleanup: ${totalDeleted} screenshots removidos (${totalFilesDeleted} arquivos) (por usuario)`);
    return { table: 'device_screenshots', deleted: totalDeleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar screenshots por usuario', { error: errorMsg });
    return { table: 'device_screenshots', deleted: totalDeleted, error: errorMsg };
  }
}

/**
 * Remove eventos de atividade antigos
 */
async function cleanupActivityEvents(retentionDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `DELETE FROM device_activity_events
       WHERE occurred_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} eventos de atividade removidos (> ${retentionDays} dias)`);

    return { table: 'device_activity_events', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar eventos de atividade', { error: errorMsg });
    return { table: 'device_activity_events', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove metricas diarias antigas
 */
async function cleanupDailyMetrics(retentionDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `DELETE FROM device_daily_metrics
       WHERE metric_date < DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} metricas diarias removidas (> ${retentionDays} dias)`);

    return { table: 'device_daily_metrics', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar metricas diarias', { error: errorMsg });
    return { table: 'device_daily_metrics', deleted: 0, error: errorMsg };
  }
}

/**
 * Anonimiza IPs em heartbeats antigos (substitui por hash parcial)
 */
async function anonymizeOldIPs(anonymizeAfterDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `UPDATE device_heartbeats
       SET ip_address = CONCAT(
         SUBSTRING_INDEX(ip_address, '.', 2),
         '.xxx.xxx'
       )
       WHERE received_at < DATE_SUB(NOW(), INTERVAL ? DAY)
         AND ip_address IS NOT NULL
         AND ip_address NOT LIKE '%.xxx.xxx'`,
      [anonymizeAfterDays]
    );

    const anonymized = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${anonymized} IPs anonimizados (> ${anonymizeAfterDays} dias)`);

    return { table: 'device_heartbeats', deleted: 0, anonymized };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao anonimizar IPs', { error: errorMsg });
    return { table: 'device_heartbeats', deleted: 0, error: errorMsg };
  }
}

/**
 * Anonimiza usuarios em heartbeats e eventos antigos
 */
async function anonymizeOldUsers(anonymizeAfterDays: number): Promise<CleanupResult> {
  try {
    // Anonimiza em heartbeats
    const heartbeatResult = await execute(
      `UPDATE device_heartbeats
       SET logged_user = 'ANONIMIZADO'
       WHERE received_at < DATE_SUB(NOW(), INTERVAL ? DAY)
         AND logged_user IS NOT NULL
         AND logged_user != 'ANONIMIZADO'`,
      [anonymizeAfterDays]
    );

    // Anonimiza em eventos de atividade
    const activityResult = await execute(
      `UPDATE device_activity_events
       SET logged_user = 'ANONIMIZADO'
       WHERE occurred_at < DATE_SUB(NOW(), INTERVAL ? DAY)
         AND logged_user IS NOT NULL
         AND logged_user != 'ANONIMIZADO'`,
      [anonymizeAfterDays]
    );

    const heartbeatAnon = (heartbeatResult as { affectedRows?: number })?.affectedRows ?? 0;
    const activityAnon = (activityResult as { affectedRows?: number })?.affectedRows ?? 0;
    const totalAnonymized = heartbeatAnon + activityAnon;

    logger.info(`LGPD Cleanup: ${totalAnonymized} usuarios anonimizados (${heartbeatAnon} heartbeats, ${activityAnon} eventos)`);

    return { table: 'usuarios', deleted: 0, anonymized: totalAnonymized };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao anonimizar usuarios', { error: errorMsg });
    return { table: 'usuarios', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove comandos e resultados expirados/antigos
 */
async function cleanupOldCommands(retentionDays: number): Promise<CleanupResult> {
  try {
    // Remove resultados de comandos antigos
    await execute(
      `DELETE cr FROM command_results cr
       INNER JOIN commands c ON cr.command_id = c.id
       WHERE c.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    // Remove comandos antigos
    const result = await execute(
      `DELETE FROM commands
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} comandos removidos (> ${retentionDays} dias)`);

    return { table: 'commands', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar comandos', { error: errorMsg });
    return { table: 'commands', deleted: 0, error: errorMsg };
  }
}

/**
 * Remove eventos (logs) antigos
 */
async function cleanupOldEvents(retentionDays: number): Promise<CleanupResult> {
  try {
    const result = await execute(
      `DELETE FROM events
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [retentionDays]
    );

    const deleted = (result as { affectedRows?: number })?.affectedRows ?? 0;
    logger.info(`LGPD Cleanup: ${deleted} eventos de log removidos (> ${retentionDays} dias)`);

    return { table: 'events', deleted };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('LGPD Cleanup: Falha ao limpar eventos de log', { error: errorMsg });
    return { table: 'events', deleted: 0, error: errorMsg };
  }
}

// =============================================================================
// JOB PRINCIPAL
// =============================================================================

export interface LGPDCleanupResult {
  success: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  results: CleanupResult[];
  totalDeleted: number;
  totalAnonymized: number;
  errors: string[];
}

/**
 * Busca configuracao LGPD padrao (fallback)
 */
async function getDefaultLGPDConfig(): Promise<LGPDConfig> {
  return DEFAULT_LGPD_CONFIG;
}

interface UserRetention {
  user_id: number;
  data_retention_days: number;
}

/**
 * Busca todos os usuarios com seus respectivos data_retention_days
 * Retorna um mapa de user_id -> data_retention_days
 */
async function getUserRetentionMap(): Promise<Map<number, number>> {
  const retentionMap = new Map<number, number>();

  try {
    const subscriptions = await query<UserRetention>(`
      SELECT s.user_id, p.data_retention_days
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `);

    if (subscriptions && Array.isArray(subscriptions)) {
      for (const sub of subscriptions) {
        retentionMap.set(sub.user_id, sub.data_retention_days);
      }
    }
  } catch (error) {
    logger.warn('LGPD Cleanup: Erro ao buscar retencao por usuario');
  }

  return retentionMap;
}

// Mantido para compatibilidade (usado em algumas funcoes)
async function getLGPDConfig(): Promise<LGPDConfig> {
  return getDefaultLGPDConfig();
}

/**
 * Executa todas as operacoes de limpeza LGPD
 * LGPD Compliance: Respeita data_retention_days individual de cada usuario/plano
 */
export async function runLGPDCleanup(): Promise<LGPDCleanupResult> {
  const startedAt = new Date();
  logger.info('=== LGPD Cleanup Job Iniciado ===');

  const config = await getDefaultLGPDConfig();
  logger.info('Configuracao LGPD padrao:', config);

  // Busca mapa de retencao por usuario
  const userRetentionMap = await getUserRetentionMap();
  logger.info(`LGPD Cleanup: ${userRetentionMap.size} usuarios com subscriptions ativas`);

  const results: CleanupResult[] = [];
  const errors: string[] = [];

  // 1. Limpar heartbeats antigos (por usuario, respeitando cada plano)
  const heartbeatsResult = await cleanupHeartbeatsByUser(userRetentionMap);
  results.push(heartbeatsResult);
  if (heartbeatsResult.error) errors.push(`Heartbeats: ${heartbeatsResult.error}`);

  // 2. Limpar snapshots antigos (por usuario, respeitando cada plano)
  const snapshotsResult = await cleanupSnapshotsByUser(userRetentionMap);
  results.push(snapshotsResult);
  if (snapshotsResult.error) errors.push(`Snapshots: ${snapshotsResult.error}`);

  // 2.1 Limpar screenshots antigos (por usuario, respeitando cada plano)
  const screenshotsResult = await cleanupScreenshotsByUser(userRetentionMap);
  results.push(screenshotsResult);
  if (screenshotsResult.error) errors.push(`Screenshots: ${screenshotsResult.error}`);

  // 3. Limpar eventos de atividade antigos
  const activityResult = await cleanupActivityEvents(config.activity_retention_days);
  results.push(activityResult);
  if (activityResult.error) errors.push(`Activity: ${activityResult.error}`);

  // 4. Limpar metricas diarias antigas
  const metricsResult = await cleanupDailyMetrics(config.heartbeat_retention_days);
  results.push(metricsResult);
  if (metricsResult.error) errors.push(`Metrics: ${metricsResult.error}`);

  // 5. Anonimizar IPs antigos
  const ipResult = await anonymizeOldIPs(config.ip_anonymize_after_days);
  results.push(ipResult);
  if (ipResult.error) errors.push(`IPs: ${ipResult.error}`);

  // 6. Anonimizar usuarios antigos
  const userResult = await anonymizeOldUsers(config.user_anonymize_after_days);
  results.push(userResult);
  if (userResult.error) errors.push(`Users: ${userResult.error}`);

  // 7. Limpar comandos antigos (mesmo periodo dos heartbeats)
  const commandsResult = await cleanupOldCommands(config.heartbeat_retention_days);
  results.push(commandsResult);
  if (commandsResult.error) errors.push(`Commands: ${commandsResult.error}`);

  // 8. Limpar eventos de log antigos
  const eventsResult = await cleanupOldEvents(config.heartbeat_retention_days);
  results.push(eventsResult);
  if (eventsResult.error) errors.push(`Events: ${eventsResult.error}`);

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const totalAnonymized = results.reduce((sum, r) => sum + (r.anonymized ?? 0), 0);

  logger.info('=== LGPD Cleanup Job Concluido ===', {
    durationMs,
    totalDeleted,
    totalAnonymized,
    errors: errors.length,
  });

  return {
    success: errors.length === 0,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs,
    results,
    totalDeleted,
    totalAnonymized,
    errors,
  };
}

// =============================================================================
// ENDPOINT PARA EXECUCAO MANUAL
// =============================================================================

export async function getLGPDStatus(): Promise<{
  config: LGPDConfig;
  stats: {
    heartbeats_total: number;
    heartbeats_old: number;
    snapshots_total: number;
    snapshots_old: number;
    screenshots_total: number;
    screenshots_old: number;
    activity_events_total: number;
    activity_events_old: number;
  };
}> {
  const config = await getLGPDConfig();

  const heartbeatsTotal = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_heartbeats`
  );
  const heartbeatsOld = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_heartbeats WHERE received_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [config.heartbeat_retention_days]
  );

  const snapshotsTotal = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_snapshots`
  );
  const snapshotsOld = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_snapshots WHERE collected_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [config.snapshot_retention_days]
  );

  const screenshotsTotal = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_screenshots`
  );
  const screenshotsOld = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_screenshots WHERE captured_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [config.screenshot_retention_days]
  );

  const activityTotal = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_activity_events`
  );
  const activityOld = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM device_activity_events WHERE occurred_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [config.activity_retention_days]
  );

  return {
    config,
    stats: {
      heartbeats_total: heartbeatsTotal?.count ?? 0,
      heartbeats_old: heartbeatsOld?.count ?? 0,
      snapshots_total: snapshotsTotal?.count ?? 0,
      snapshots_old: snapshotsOld?.count ?? 0,
      screenshots_total: screenshotsTotal?.count ?? 0,
      screenshots_old: screenshotsOld?.count ?? 0,
      activity_events_total: activityTotal?.count ?? 0,
      activity_events_old: activityOld?.count ?? 0,
    },
  };
}

// =============================================================================
// EXPORTACAO DE DADOS LGPD (PORTABILIDADE)
// =============================================================================

export interface LGPDExportData {
  exportedAt: string;
  config: LGPDConfig;
  devices: unknown[];
  heartbeats: unknown[];
  activityEvents: unknown[];
  commands: unknown[];
}

/**
 * Exporta todos os dados para portabilidade LGPD
 * Retorna um objeto JSON com todos os dados coletados
 */
export async function exportLGPDData(): Promise<LGPDExportData> {
  const config = await getLGPDConfig();

  // Buscar todos os dispositivos
  const devices = await query<unknown[]>(
    `SELECT
      d.id, d.device_id, d.hostname, d.service_tag,
      d.status, d.filial_id, d.lgpd_consent, d.lgpd_consent_at,
      d.created_at, d.updated_at,
      dh.cpu_name, dh.cpu_cores, dh.cpu_threads, dh.ram_total_gb,
      dh.gpu_name, dh.bios_version, dh.motherboard_manufacturer, dh.motherboard_product
    FROM devices d
    LEFT JOIN device_hardware dh ON d.id = dh.device_id`
  );

  // Buscar heartbeats (ultimos 90 dias por padrao)
  const heartbeats = await query<unknown[]>(
    `SELECT
      device_id, ip_address, logged_user, os_version,
      cpu_usage, memory_usage, uptime_seconds,
      received_at
    FROM device_heartbeats
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY received_at DESC`,
    [config.heartbeat_retention_days]
  );

  // Buscar eventos de atividade
  const activityEvents = await query<unknown[]>(
    `SELECT
      device_id, event_type, occurred_at, logged_user,
      ip_address, session_id, duration_seconds, details,
      received_at
    FROM device_activity_events
    WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY occurred_at DESC`,
    [config.activity_retention_days]
  );

  // Buscar comandos executados
  const commands = await query<unknown[]>(
    `SELECT
      c.id, c.device_id, c.type, c.status, c.created_at, c.executed_at,
      cr.output, cr.error, cr.received_at as result_received_at
    FROM commands c
    LEFT JOIN command_results cr ON c.id = cr.command_id
    WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    ORDER BY c.created_at DESC`,
    [config.heartbeat_retention_days]
  );

  logger.info('LGPD Export: Dados exportados com sucesso', {
    devices: (devices as unknown[])?.length ?? 0,
    heartbeats: (heartbeats as unknown[])?.length ?? 0,
    activityEvents: (activityEvents as unknown[])?.length ?? 0,
    commands: (commands as unknown[])?.length ?? 0,
  });

  return {
    exportedAt: new Date().toISOString(),
    config,
    devices: devices as unknown[] ?? [],
    heartbeats: heartbeats as unknown[] ?? [],
    activityEvents: activityEvents as unknown[] ?? [],
    commands: commands as unknown[] ?? [],
  };
}
