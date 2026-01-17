import { query, queryOne } from '../../config/database.js';
import { logger } from '../../config/logger.js';

// =============================================================================
// TIPOS DE RELATORIOS
// =============================================================================

export interface UptimeReport {
  summary: {
    avgUptimePercent: number;
    avgOnlineHours: number;
    avgOfflineHours: number;
    totalDevices: number;
  };
  devices: Array<{
    id: number;
    hostname: string;
    serviceTag: string | null;
    uptimePercent: number;
    onlineHours: number;
    offlineHours: number;
    lastSeen: string | null;
  }>;
}

export interface ActivityReport {
  summary: {
    totalHeartbeats: number;
    totalLogins: number;
    totalLogouts: number;
    totalBoots: number;
    totalShutdowns: number;
    activeDevices: number;
  };
  dailyActivity: Array<{
    date: string;
    heartbeats: number;
    logins: number;
    events: number;
  }>;
}

export interface UsageReport {
  summary: {
    avgCpuPercent: number;
    avgRamPercent: number;
    avgDiskUsedPercent: number;
  };
  devices: Array<{
    id: number;
    hostname: string;
    avgCpu: number;
    avgRam: number;
    avgDisk: number;
  }>;
}

export interface IdleReport {
  devices: Array<{
    id: number;
    hostname: string;
    serviceTag: string | null;
    avgCpu: number;
    avgRam: number;
    idleScore: number;
    lastActivity: string | null;
  }>;
}

export interface UsersReport {
  devices: Array<{
    id: number;
    hostname: string;
    uniqueUsers: number;
    lastUser: string | null;
    lastLoginAt: string | null;
    users: string[];
  }>;
}

export interface InventoryReport {
  devices: Array<{
    id: number;
    hostname: string;
    serviceTag: string | null;
    cpuModel: string | null;
    cpuCores: number | null;
    ramTotalGb: number | null;
    gpuModel: string | null;
    totalDiskGb: number | null;
    diskType: string | null;
    osName: string | null;
  }>;
}

export interface GrowthReport {
  summary: {
    totalDevices: number;
    newInPeriod: number;
    growthPercent: number;
  };
  monthly: Array<{
    month: string;
    total: number;
    new: number;
  }>;
}

// =============================================================================
// FUNCOES DE RELATORIOS
// =============================================================================

/**
 * Calcula dias do periodo baseado no dateRange
 */
function getDaysFromRange(dateRange: string): number {
  switch (dateRange) {
    case '7d': return 7;
    case '15d': return 15;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}

/**
 * Relatorio de Uptime dos Dispositivos
 */
export async function getUptimeReport(dateRange: string): Promise<UptimeReport> {
  const days = getDaysFromRange(dateRange);

  // Busca dispositivos com contagem de heartbeats
  const devices = await query<{
    id: number;
    hostname: string;
    service_tag: string | null;
    heartbeat_count: number;
    last_seen_at: string | null;
  }>(`
    SELECT
      d.id,
      d.hostname,
      d.service_tag,
      COUNT(h.id) as heartbeat_count,
      MAX(h.received_at) as last_seen_at
    FROM devices d
    LEFT JOIN device_heartbeats h ON d.id = h.device_id
      AND h.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    WHERE d.status != 'blocked'
    GROUP BY d.id, d.hostname, d.service_tag
    ORDER BY heartbeat_count DESC
  `, [days]);

  // Calcula uptime baseado em heartbeats (intervalo esperado de 5 min)
  const expectedHeartbeats = days * 24 * 12; // 12 heartbeats/hora * 24h * dias

  const devicesWithUptime = devices.map(d => {
    const uptimePercent = Math.min(100, Math.round((d.heartbeat_count / expectedHeartbeats) * 100));
    const totalHours = days * 24;
    const onlineHours = Math.round((uptimePercent / 100) * totalHours);
    const offlineHours = totalHours - onlineHours;

    return {
      id: d.id,
      hostname: d.hostname,
      serviceTag: d.service_tag,
      uptimePercent,
      onlineHours,
      offlineHours,
      lastSeen: d.last_seen_at,
    };
  });

  const avgUptime = devicesWithUptime.length > 0
    ? Math.round(devicesWithUptime.reduce((sum, d) => sum + d.uptimePercent, 0) / devicesWithUptime.length)
    : 0;

  const avgOnline = devicesWithUptime.length > 0
    ? Math.round(devicesWithUptime.reduce((sum, d) => sum + d.onlineHours, 0) / devicesWithUptime.length)
    : 0;

  const avgOffline = devicesWithUptime.length > 0
    ? Math.round(devicesWithUptime.reduce((sum, d) => sum + d.offlineHours, 0) / devicesWithUptime.length)
    : 0;

  return {
    summary: {
      avgUptimePercent: avgUptime,
      avgOnlineHours: avgOnline,
      avgOfflineHours: avgOffline,
      totalDevices: devicesWithUptime.length,
    },
    devices: devicesWithUptime,
  };
}

/**
 * Relatorio de Atividade por Periodo
 */
export async function getActivityReport(dateRange: string): Promise<ActivityReport> {
  const days = getDaysFromRange(dateRange);

  // Contagem de heartbeats
  const heartbeatCount = await queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM device_heartbeats
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
  `, [days]);

  // Contagem de eventos de atividade por tipo
  const eventCounts = await query<{ event_type: string; count: number }>(`
    SELECT event_type, COUNT(*) as count
    FROM device_activity_events
    WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY event_type
  `, [days]);

  const counts: Record<string, number> = {};
  eventCounts.forEach(e => { counts[e.event_type] = e.count; });

  // Dispositivos ativos no periodo
  const activeDevices = await queryOne<{ count: number }>(`
    SELECT COUNT(DISTINCT device_id) as count
    FROM device_heartbeats
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
  `, [days]);

  // Atividade diaria
  const dailyActivity = await query<{ date: string; heartbeats: number; logins: number; events: number }>(`
    SELECT
      DATE(h.received_at) as date,
      COUNT(DISTINCT h.id) as heartbeats,
      COALESCE(e.logins, 0) as logins,
      COALESCE(e.total_events, 0) as events
    FROM device_heartbeats h
    LEFT JOIN (
      SELECT
        DATE(occurred_at) as date,
        SUM(CASE WHEN event_type = 'login' THEN 1 ELSE 0 END) as logins,
        COUNT(*) as total_events
      FROM device_activity_events
      WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(occurred_at)
    ) e ON DATE(h.received_at) = e.date
    WHERE h.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(h.received_at)
    ORDER BY date DESC
    LIMIT 30
  `, [days, days]);

  return {
    summary: {
      totalHeartbeats: heartbeatCount?.count ?? 0,
      totalLogins: counts['login'] ?? 0,
      totalLogouts: counts['logout'] ?? 0,
      totalBoots: counts['boot'] ?? 0,
      totalShutdowns: counts['shutdown'] ?? 0,
      activeDevices: activeDevices?.count ?? 0,
    },
    dailyActivity,
  };
}

/**
 * Relatorio de Uso de Recursos
 */
export async function getUsageReport(dateRange: string): Promise<UsageReport> {
  const days = getDaysFromRange(dateRange);

  // Media geral de uso
  const avgUsage = await queryOne<{ avg_cpu: number; avg_ram: number }>(`
    SELECT
      AVG(cpu_percent) as avg_cpu,
      AVG(ram_percent) as avg_ram
    FROM device_heartbeats
    WHERE received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND cpu_percent IS NOT NULL
  `, [days]);

  // Media de disco por dispositivo
  const avgDisk = await queryOne<{ avg_disk: number }>(`
    SELECT AVG(used_percent) as avg_disk
    FROM device_disks
  `);

  // Uso por dispositivo
  const deviceUsage = await query<{
    id: number;
    hostname: string;
    avg_cpu: number;
    avg_ram: number;
  }>(`
    SELECT
      d.id,
      d.hostname,
      AVG(h.cpu_percent) as avg_cpu,
      AVG(h.ram_percent) as avg_ram
    FROM devices d
    LEFT JOIN device_heartbeats h ON d.id = h.device_id
      AND h.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    WHERE d.status != 'blocked'
    GROUP BY d.id, d.hostname
    HAVING avg_cpu IS NOT NULL
    ORDER BY avg_cpu DESC
  `, [days]);

  // Busca uso de disco por dispositivo
  const diskUsage = await query<{ device_id: number; avg_disk: number }>(`
    SELECT device_id, AVG(used_percent) as avg_disk
    FROM device_disks
    GROUP BY device_id
  `);

  const diskMap = new Map(diskUsage.map(d => [d.device_id, d.avg_disk]));

  return {
    summary: {
      avgCpuPercent: Math.round(avgUsage?.avg_cpu ?? 0),
      avgRamPercent: Math.round(avgUsage?.avg_ram ?? 0),
      avgDiskUsedPercent: Math.round(avgDisk?.avg_disk ?? 0),
    },
    devices: deviceUsage.map(d => ({
      id: d.id,
      hostname: d.hostname,
      avgCpu: Math.round(d.avg_cpu ?? 0),
      avgRam: Math.round(d.avg_ram ?? 0),
      avgDisk: Math.round(diskMap.get(d.id) ?? 0),
    })),
  };
}

/**
 * Relatorio de Dispositivos Ociosos
 */
export async function getIdleReport(dateRange: string): Promise<IdleReport> {
  const days = getDaysFromRange(dateRange);

  // Busca dispositivos com baixo uso
  const devices = await query<{
    id: number;
    hostname: string;
    service_tag: string | null;
    avg_cpu: number;
    avg_ram: number;
    last_activity: string | null;
  }>(`
    SELECT
      d.id,
      d.hostname,
      d.service_tag,
      AVG(h.cpu_percent) as avg_cpu,
      AVG(h.ram_percent) as avg_ram,
      MAX(h.received_at) as last_activity
    FROM devices d
    LEFT JOIN device_heartbeats h ON d.id = h.device_id
      AND h.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    WHERE d.status != 'blocked'
    GROUP BY d.id, d.hostname, d.service_tag
    HAVING avg_cpu IS NOT NULL AND avg_cpu < 20 AND avg_ram < 40
    ORDER BY avg_cpu ASC, avg_ram ASC
    LIMIT 20
  `, [days]);

  return {
    devices: devices.map(d => ({
      id: d.id,
      hostname: d.hostname,
      serviceTag: d.service_tag,
      avgCpu: Math.round(d.avg_cpu ?? 0),
      avgRam: Math.round(d.avg_ram ?? 0),
      idleScore: Math.round(100 - ((d.avg_cpu ?? 0) + (d.avg_ram ?? 0)) / 2),
      lastActivity: d.last_activity,
    })),
  };
}

/**
 * Relatorio de Usuarios por Dispositivo
 */
export async function getUsersReport(dateRange: string): Promise<UsersReport> {
  const days = getDaysFromRange(dateRange);

  // Busca usuarios por dispositivo via heartbeats
  const deviceUsers = await query<{
    id: number;
    hostname: string;
    users: string;
    last_user: string | null;
    last_login: string | null;
  }>(`
    SELECT
      d.id,
      d.hostname,
      GROUP_CONCAT(DISTINCT h.logged_user ORDER BY h.received_at DESC SEPARATOR ',') as users,
      (SELECT logged_user FROM device_heartbeats WHERE device_id = d.id ORDER BY received_at DESC LIMIT 1) as last_user,
      MAX(h.received_at) as last_login
    FROM devices d
    LEFT JOIN device_heartbeats h ON d.id = h.device_id
      AND h.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND h.logged_user IS NOT NULL
      AND h.logged_user != ''
      AND h.logged_user != 'ANONIMIZADO'
    WHERE d.status != 'blocked'
    GROUP BY d.id, d.hostname
    ORDER BY d.hostname
  `, [days]);

  return {
    devices: deviceUsers.map(d => {
      const userList = d.users ? d.users.split(',').filter(u => u && u !== 'null') : [];
      return {
        id: d.id,
        hostname: d.hostname,
        uniqueUsers: userList.length,
        lastUser: d.last_user,
        lastLoginAt: d.last_login,
        users: userList.slice(0, 5), // Limita a 5 usuarios
      };
    }),
  };
}

/**
 * Relatorio de Inventario de Hardware
 */
export async function getInventoryReport(): Promise<InventoryReport> {
  const devices = await query<{
    id: number;
    hostname: string;
    service_tag: string | null;
    os_name: string | null;
    cpu_model: string | null;
    cpu_cores: number | null;
    ram_total_gb: number | null;
    gpu_model: string | null;
    total_disk: number | null;
    disk_type: string | null;
  }>(`
    SELECT
      d.id,
      d.hostname,
      d.service_tag,
      d.os_name,
      hw.cpu_model,
      hw.cpu_cores,
      hw.ram_total_gb,
      hw.gpu_model,
      (SELECT SUM(total_gb) FROM device_disks WHERE device_id = d.id) as total_disk,
      (SELECT disk_type FROM device_disks WHERE device_id = d.id LIMIT 1) as disk_type
    FROM devices d
    LEFT JOIN device_hardware hw ON d.id = hw.device_id
    WHERE d.status != 'blocked'
    ORDER BY d.hostname
  `);

  return {
    devices: devices.map(d => ({
      id: d.id,
      hostname: d.hostname,
      serviceTag: d.service_tag,
      cpuModel: d.cpu_model,
      cpuCores: d.cpu_cores,
      ramTotalGb: d.ram_total_gb ? Math.round(d.ram_total_gb) : null,
      gpuModel: d.gpu_model,
      totalDiskGb: d.total_disk ? Math.round(d.total_disk) : null,
      diskType: d.disk_type,
      osName: d.os_name,
    })),
  };
}

/**
 * Relatorio de Crescimento do Patio
 */
export async function getGrowthReport(dateRange: string): Promise<GrowthReport> {
  const days = getDaysFromRange(dateRange);

  // Total atual
  const totalDevices = await queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM devices WHERE status != 'blocked'
  `);

  // Novos no periodo
  const newInPeriod = await queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM devices
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND status != 'blocked'
  `, [days]);

  // Total antes do periodo
  const totalBefore = (totalDevices?.count ?? 0) - (newInPeriod?.count ?? 0);
  const growthPercent = totalBefore > 0
    ? Math.round(((newInPeriod?.count ?? 0) / totalBefore) * 100)
    : (newInPeriod?.count ?? 0) > 0 ? 100 : 0;

  // Crescimento mensal (ultimos 6 meses)
  const monthly = await query<{ month: string; total: number; new_count: number }>(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as new_count,
      (SELECT COUNT(*) FROM devices d2 WHERE d2.created_at <= LAST_DAY(d1.created_at) AND d2.status != 'blocked') as total
    FROM devices d1
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      AND status != 'blocked'
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
  `);

  return {
    summary: {
      totalDevices: totalDevices?.count ?? 0,
      newInPeriod: newInPeriod?.count ?? 0,
      growthPercent,
    },
    monthly: monthly.map(m => ({
      month: m.month,
      total: m.total,
      new: m.new_count,
    })),
  };
}

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: unknown[], filename: string): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0] as object);
  const rows = data.map(row => {
    const r = row as Record<string, unknown>;
    return headers.map(h => {
      const value = r[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
