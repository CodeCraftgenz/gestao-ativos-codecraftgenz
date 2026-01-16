import { query, queryOne, execute, insert } from '../../config/database.js';
import type {
  Device,
  DashboardStats,
  DashboardAnalytics,
  HourlyActivity,
  DeviceHealthSummary,
  DeviceUsageMetric,
  RecentActivity,
  PlanUsage,
} from '../../types/index.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function getStats(): Promise<DashboardStats> {
  const result = await queryOne<{
    total: number;
    online: number;
    offline: number;
    pending: number;
    blocked: number;
  }>(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
      SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
    FROM devices
  `);

  return {
    totalDevices: result?.total || 0,
    onlineDevices: result?.online || 0,
    offlineDevices: result?.offline || 0,
    pendingDevices: result?.pending || 0,
    blockedDevices: result?.blocked || 0,
  };
}

export interface DeviceFilters {
  status?: string;
  search?: string;
  filial_id?: number;
  page?: number;
  limit?: number;
}

export async function getDevices(filters: DeviceFilters) {
  const { status, search, filial_id, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  if (status) {
    whereClause += ' AND d.status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (d.hostname LIKE ? OR d.serial_bios LIKE ? OR d.primary_mac_address LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filial_id) {
    whereClause += ' AND d.filial_id = ?';
    params.push(filial_id);
  }

  // Count total
  const countResult = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM devices d WHERE ${whereClause}`,
    params
  );
  const total = countResult?.total || 0;

  // Get devices - LIMIT e OFFSET como numeros na string (mysql2 execute nao aceita ? para LIMIT)
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const devices = await query<Device>(
    `SELECT d.*, f.name as filial_nome
     FROM devices d
     LEFT JOIN filiais f ON d.filial_id = f.id
     WHERE ${whereClause}
     ORDER BY d.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  return {
    data: devices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPendingDevices(): Promise<Device[]> {
  return query<Device>(
    `SELECT * FROM devices WHERE status = 'pending' ORDER BY created_at ASC`
  );
}

export async function getDeviceById(id: number): Promise<Device & {
  hardware?: unknown;
  disks?: unknown[];
  network?: unknown[];
  software?: unknown[];
}> {
  const device = await queryOne<Device>(
    `SELECT d.*, f.name as filial_nome
     FROM devices d
     LEFT JOIN filiais f ON d.filial_id = f.id
     WHERE d.id = ?`,
    [id]
  );

  if (!device) {
    throw new AppError(404, 'Dispositivo nao encontrado');
  }

  // Busca dados de hardware
  const hardware = await queryOne(
    `SELECT * FROM device_hardware WHERE device_id = ? ORDER BY collected_at DESC LIMIT 1`,
    [id]
  );

  // Busca discos
  const disks = await query(
    `SELECT * FROM device_disks WHERE device_id = ? ORDER BY drive_letter`,
    [id]
  );

  // Busca interfaces de rede
  const network = await query(
    `SELECT * FROM device_network WHERE device_id = ? ORDER BY is_primary DESC, interface_name`,
    [id]
  );

  // Busca software instalado
  const software = await query(
    `SELECT * FROM device_software WHERE device_id = ? ORDER BY name`,
    [id]
  );

  return {
    ...device,
    hardware: hardware || undefined,
    disks: disks.length > 0 ? disks : undefined,
    network: network.length > 0 ? network : undefined,
    software: software.length > 0 ? software : undefined,
  };
}

export async function approveDevice(id: number, userId: number): Promise<void> {
  const device = await getDeviceById(id);

  if (device.status !== 'pending') {
    throw new AppError(400, 'Dispositivo nao esta pendente');
  }

  await execute(
    `UPDATE devices SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?`,
    [userId, id]
  );
}

export async function blockDevice(id: number, userId: number, reason: string): Promise<void> {
  await execute(
    `UPDATE devices SET status = 'blocked', blocked_at = NOW(), blocked_by = ?, block_reason = ? WHERE id = ?`,
    [userId, reason, id]
  );
}

export async function unblockDevice(id: number): Promise<void> {
  const device = await getDeviceById(id);

  if (device.status !== 'blocked') {
    throw new AppError(400, 'Dispositivo nao esta bloqueado');
  }

  await execute(
    `UPDATE devices SET status = 'offline', blocked_at = NULL, blocked_by = NULL, block_reason = NULL WHERE id = ?`,
    [id]
  );
}

export async function sendCommand(
  deviceId: number,
  userId: number,
  type: string,
  payload?: object
): Promise<number> {
  const device = await getDeviceById(deviceId);

  if (device.status === 'pending' || device.status === 'blocked') {
    throw new AppError(400, 'Nao e possivel enviar comando para este dispositivo');
  }

  const commandId = await insert(
    `INSERT INTO commands (device_id, type, payload, created_by, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    [deviceId, type, JSON.stringify(payload || {}), userId]
  );

  return commandId;
}

// Busca dispositivo por Service Tag (serial_bios)
export async function getDeviceByServiceTag(serviceTag: string): Promise<Device | null> {
  const device = await queryOne<Device>(
    `SELECT d.*, f.name as filial_nome
     FROM devices d
     LEFT JOIN filiais f ON d.filial_id = f.id
     WHERE d.serial_bios = ?`,
    [serviceTag]
  );

  return device || null;
}

// Pre-registro de dispositivo por Service Tag
export interface PreRegisteredDevice {
  id: number;
  service_tag: string;
  description: string | null;
  filial_id: number | null;
  registered_by: number;
  registered_at: Date;
  enrolled: boolean;
  device_id: number | null;
}

export async function registerByServiceTag(
  serviceTag: string,
  description: string | null,
  filialId: number | null,
  userId: number
): Promise<{ id: number; isNew: boolean }> {
  // Verifica se ja existe dispositivo com essa service tag
  const existingDevice = await getDeviceByServiceTag(serviceTag);
  if (existingDevice) {
    throw new AppError(400, 'Ja existe um dispositivo registrado com esta Service Tag');
  }

  // Verifica se ja existe pre-registro
  const existingPreReg = await queryOne<PreRegisteredDevice>(
    `SELECT * FROM pre_registered_devices WHERE service_tag = ?`,
    [serviceTag]
  );

  if (existingPreReg) {
    throw new AppError(400, 'Esta Service Tag ja esta pre-registrada');
  }

  // Cria o pre-registro (garantir que undefined vire null)
  const id = await insert(
    `INSERT INTO pre_registered_devices (service_tag, description, filial_id, registered_by)
     VALUES (?, ?, ?, ?)`,
    [serviceTag, description ?? null, filialId ?? null, userId]
  );

  return { id, isNew: true };
}

// Lista dispositivos pre-registrados
export async function getPreRegisteredDevices(): Promise<PreRegisteredDevice[]> {
  return query<PreRegisteredDevice>(
    `SELECT pr.*, u.email as registered_by_email, f.name as filial_nome
     FROM pre_registered_devices pr
     LEFT JOIN users u ON pr.registered_by = u.id
     LEFT JOIN filiais f ON pr.filial_id = f.id
     ORDER BY pr.registered_at DESC`
  );
}

// Busca interface de rede primaria do dispositivo
export async function getDevicePrimaryNetwork(deviceId: number): Promise<{
  ip_address: string;
  mac_address: string;
  interface_name: string;
} | null> {
  return queryOne(
    `SELECT ipv4_address as ip_address, mac_address, interface_name
     FROM device_network
     WHERE device_id = ? AND is_primary = 1
     LIMIT 1`,
    [deviceId]
  );
}

// =============================================================================
// DASHBOARD ANALYTICS - Metricas avancadas para graficos
// =============================================================================

/**
 * Retorna atividade por hora das ultimas 24 horas (heartbeats)
 */
async function getHourlyActivity(): Promise<HourlyActivity[]> {
  const rows = await query<{
    hour: number;
    heartbeats: number;
    active_devices: number;
  }>(`
    SELECT
      HOUR(received_at) as hour,
      COUNT(*) as heartbeats,
      COUNT(DISTINCT device_id) as active_devices
    FROM device_heartbeats
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY HOUR(received_at)
    ORDER BY hour ASC
  `);

  // Preenche horas sem dados com zeros
  const result: HourlyActivity[] = [];
  for (let h = 0; h < 24; h++) {
    const found = rows.find(r => r.hour === h);
    result.push({
      hour: h,
      heartbeats: found?.heartbeats || 0,
      active_devices: found?.active_devices || 0,
    });
  }

  return result;
}

/**
 * Retorna resumo de saude dos dispositivos
 */
async function getHealthSummary(): Promise<DeviceHealthSummary> {
  // Online: status = 'online'
  // Offline: status = 'offline' ou 'approved'
  // Alert: disco > 90% ou sem sinal ha mais de 24h
  const result = await queryOne<{
    online: number;
    offline: number;
    alert: number;
  }>(`
    SELECT
      SUM(CASE WHEN d.status = 'online' THEN 1 ELSE 0 END) as online,
      SUM(CASE WHEN d.status IN ('offline', 'approved') THEN 1 ELSE 0 END) as offline,
      SUM(CASE
        WHEN d.last_seen_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1
        WHEN EXISTS (
          SELECT 1 FROM device_disks dd
          WHERE dd.device_id = d.id AND dd.used_percent > 90
        ) THEN 1
        ELSE 0
      END) as alert
    FROM devices d
    WHERE d.status NOT IN ('pending', 'blocked')
  `);

  return {
    online: result?.online || 0,
    offline: result?.offline || 0,
    alert: result?.alert || 0,
  };
}

/**
 * Retorna metricas de uso/ociosidade dos dispositivos
 */
async function getUsageMetrics(): Promise<DeviceUsageMetric[]> {
  return query<DeviceUsageMetric>(`
    SELECT
      d.id as device_id,
      d.hostname,
      COALESCE(AVG(h.cpu_percent), 0) as avg_cpu_percent,
      COALESCE(AVG(h.ram_percent), 0) as avg_ram_percent,
      COALESCE(MAX(h.uptime_seconds) / 3600, 0) as uptime_hours,
      CASE
        WHEN AVG(h.cpu_percent) < 10 AND AVG(h.ram_percent) < 30 THEN 90
        WHEN AVG(h.cpu_percent) < 20 AND AVG(h.ram_percent) < 50 THEN 70
        WHEN AVG(h.cpu_percent) < 40 THEN 40
        ELSE 10
      END as idle_score
    FROM devices d
    LEFT JOIN device_heartbeats h ON d.id = h.device_id
      AND h.received_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    WHERE d.status NOT IN ('pending', 'blocked')
    GROUP BY d.id, d.hostname
    ORDER BY idle_score DESC
    LIMIT 10
  `);
}

/**
 * Retorna atividades recentes (ultimos heartbeats e eventos)
 */
async function getRecentActivity(): Promise<RecentActivity[]> {
  // Combina heartbeats e eventos de atividade
  const heartbeats = await query<RecentActivity>(`
    SELECT
      d.id as device_id,
      d.hostname,
      h.logged_user as assigned_user,
      h.ip_address,
      d.last_seen_at,
      d.status,
      'heartbeat' as event_type
    FROM devices d
    INNER JOIN (
      SELECT device_id, MAX(received_at) as max_time
      FROM device_heartbeats
      GROUP BY device_id
    ) latest ON d.id = latest.device_id
    INNER JOIN device_heartbeats h ON h.device_id = latest.device_id AND h.received_at = latest.max_time
    WHERE d.status NOT IN ('pending', 'blocked')
    ORDER BY d.last_seen_at DESC
    LIMIT 10
  `);

  return heartbeats;
}

/**
 * Retorna uso do plano atual
 */
async function getPlanUsage(userId: number): Promise<PlanUsage> {
  // Busca plano do usuario - usando IFNULL para colunas que podem nao existir
  const subscription = await queryOne<{
    plan_name: string;
    max_devices: number;
    data_retention_days: number;
  }>(`
    SELECT
      COALESCE(p.name, 'Gratuito') as plan_name,
      COALESCE(p.max_devices, 5) as max_devices,
      30 as data_retention_days
    FROM subscriptions s
    INNER JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = ? AND s.status = 'active'
    ORDER BY s.id DESC
    LIMIT 1
  `, [userId]);

  // Conta dispositivos atuais
  const deviceCount = await queryOne<{ total: number }>(
    `SELECT COUNT(*) as total FROM devices WHERE status NOT IN ('blocked')`
  );

  const currentDevices = deviceCount?.total || 0;
  const maxDevices = subscription?.max_devices || 5;
  const usagePercent = maxDevices > 0 ? Math.round((currentDevices / maxDevices) * 100) : 0;

  return {
    current_devices: currentDevices,
    max_devices: maxDevices,
    usage_percent: usagePercent,
    plan_name: subscription?.plan_name || 'Gratuito',
    retention_days: subscription?.data_retention_days || 30,
    near_limit: usagePercent >= 80,
  };
}

/**
 * Endpoint principal de analytics do dashboard
 */
export async function getDashboardAnalytics(userId: number): Promise<DashboardAnalytics> {
  const [
    stats,
    hourlyActivity,
    healthSummary,
    usageMetrics,
    recentActivity,
    planUsage,
  ] = await Promise.all([
    getStats(),
    getHourlyActivity(),
    getHealthSummary(),
    getUsageMetrics(),
    getRecentActivity(),
    getPlanUsage(userId),
  ]);

  return {
    stats,
    hourly_activity: hourlyActivity,
    health_summary: healthSummary,
    usage_metrics: usageMetrics,
    recent_activity: recentActivity,
    plan_usage: planUsage,
  };
}

