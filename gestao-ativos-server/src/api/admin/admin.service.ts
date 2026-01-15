import { query, queryOne, execute, insert } from '../../config/database.js';
import type { Device, DashboardStats } from '../../types/index.js';
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
    `SELECT d.*, f.descricao as filial_nome
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
    `SELECT d.*, f.descricao as filial_nome
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
    `SELECT d.*, f.descricao as filial_nome
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
    `SELECT pr.*, u.email as registered_by_email, f.descricao as filial_nome
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

// Interface para dados do OverlayCraft
export interface OverlayCraftRealTimeData {
  serviceTag: string;
  hostname: string;
  username: string;
  os: string;
  timestamp: string;
  cpu: {
    name: string;
    usagePercent: number;
    temperature: number;
    cores: number[];
  };
  gpu: {
    name: string;
    usagePercent: number;
    temperature: number;
  };
  ram: {
    usagePercent: number;
    totalGB: number;
    usedGB: number;
    pageWrites: number;
    modifiedMB: number;
  };
  disks: Array<{
    letter: string;
    totalGB: number;
    freeGB: number;
    usedGB: number;
    usagePercent: number;
    queueLength: number;
  }>;
  network: {
    ip: string;
    mask: string;
    gateway: string;
    mac: string;
    wifiSSID: string;
  };
  battery: {
    percentage: number;
    isCharging: boolean;
    hasBattery: boolean;
  };
}

// Busca dados em tempo real do OverlayCraft
export async function fetchOverlayCraftData(ipAddress: string): Promise<OverlayCraftRealTimeData | null> {
  const OVERLAY_PORT = 8585;
  const TIMEOUT_MS = 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`http://${ipAddress}:${OVERLAY_PORT}/status`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new AppError(502, `OverlayCraft retornou status ${response.status}`);
    }

    const data = await response.json() as OverlayCraftRealTimeData;
    return data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new AppError(504, 'Timeout ao conectar com OverlayCraft');
      }
      throw new AppError(502, `Erro ao conectar com OverlayCraft: ${error.message}`);
    }
    throw new AppError(502, 'Erro desconhecido ao conectar com OverlayCraft');
  }
}

// Interface para o payload recebido do OverlayCraft
export interface OverlayCraftSnapshot {
  serviceTag: string;
  usuario: string;
  so: string;
  cpu: string;
  cpu_Uso: string;
  cpu_Temp: string;
  gpu: string;
  gpu_Uso: string;
  gpu_Temp: string;
  ram_Total: string;
  ram_Uso: string;
  ram_PageWritesSec: string;
  ram_ModifiedPages: string;
  discos: string;
  ip: string;
  mascara: string;
  gateway: string;
  ssidWiFi: string;
  mac: string;
  bateria: string;
  energia: string;
  timestamp: string;
}

// Armazenamento em memória dos snapshots (por ServiceTag) - exportado para uso pelo agent.service
export const snapshotCache: Map<string, OverlayCraftSnapshot & { receivedAt: Date }> = new Map();

/**
 * Recebe e armazena um snapshot do OverlayCraft
 */
export async function receiveOverlayCraftSnapshot(snapshot: OverlayCraftSnapshot): Promise<void> {
  if (!snapshot.serviceTag) {
    throw new AppError(400, 'ServiceTag é obrigatório');
  }

  // Armazena no cache com timestamp de recebimento
  snapshotCache.set(snapshot.serviceTag.toUpperCase(), {
    ...snapshot,
    receivedAt: new Date()
  });

  console.log(`[OverlayCraft] Snapshot recebido de ${snapshot.serviceTag} - IP: ${snapshot.ip}`);
}

/**
 * Obtém o snapshot mais recente de um dispositivo pelo ServiceTag
 */
export async function getSnapshotByServiceTag(serviceTag: string): Promise<(OverlayCraftSnapshot & { receivedAt: Date }) | null> {
  const snapshot = snapshotCache.get(serviceTag.toUpperCase());

  if (!snapshot) {
    return null;
  }

  // Verifica se o snapshot não está muito antigo (mais de 60 segundos)
  const now = new Date();
  const diff = now.getTime() - snapshot.receivedAt.getTime();
  const isStale = diff > 60000; // 60 segundos

  if (isStale) {
    return { ...snapshot, receivedAt: snapshot.receivedAt };
  }

  return snapshot;
}

/**
 * Lista todos os snapshots ativos (recebidos nos últimos 60 segundos)
 */
export async function getActiveSnapshots(): Promise<Array<OverlayCraftSnapshot & { receivedAt: Date; isOnline: boolean }>> {
  const now = new Date();
  const result: Array<OverlayCraftSnapshot & { receivedAt: Date; isOnline: boolean }> = [];

  snapshotCache.forEach((snapshot) => {
    const diff = now.getTime() - snapshot.receivedAt.getTime();
    const isOnline = diff <= 60000; // 60 segundos

    result.push({
      ...snapshot,
      isOnline
    });
  });

  // Ordena por mais recente primeiro
  return result.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}

/**
 * Obtém dados em tempo real de um dispositivo pelo ID (busca no cache por ServiceTag)
 */
export async function getRealTimeDataFromCache(deviceId: number): Promise<OverlayCraftSnapshot & { receivedAt: Date } | null> {
  // Primeiro busca o dispositivo para obter o ServiceTag
  const device = await queryOne<{ serial_bios: string }>(
    'SELECT serial_bios FROM devices WHERE id = ?',
    [deviceId]
  );

  console.log(`[getRealTimeDataFromCache] deviceId=${deviceId}, serial_bios=${device?.serial_bios || 'null'}, cacheSize=${snapshotCache.size}`);

  if (!device || !device.serial_bios) {
    console.log(`[getRealTimeDataFromCache] Device not found or no serial_bios`);
    return null;
  }

  const snapshot = await getSnapshotByServiceTag(device.serial_bios);
  console.log(`[getRealTimeDataFromCache] Snapshot found: ${snapshot ? 'yes' : 'no'}`);

  return snapshot;
}
