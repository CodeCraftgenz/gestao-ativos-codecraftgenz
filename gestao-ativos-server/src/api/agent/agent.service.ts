import { query, queryOne, insert, execute, transaction } from '../../config/database.js';
import { config } from '../../config/index.js';
import { logger, logAgentActivity } from '../../config/logger.js';
import { generateSecureToken, hashAgentToken } from '../../utils/hash.util.js';
import { generateAgentAccessToken, generateAgentRefreshToken } from '../../utils/token.util.js';
import { DeviceStatus, CommandStatus } from '../../types/index.js';
import { ConflictError, NotFoundError } from '../../middleware/error.middleware.js';
import {
  EnrollRequest,
  EnrollResponse,
  AgentConfig,
  HeartbeatRequest,
  HeartbeatResponse,
  InventoryRequest,
  InventoryResponse,
  CommandResponse,
  CommandResultRequest,
  EventsRequest,
  SnapshotRequest,
  SnapshotResponse,
} from './agent.dto.js';
import type { PoolConnection } from 'mysql2/promise';

// =============================================================================
// TIPOS INTERNOS
// =============================================================================

interface DeviceRow {
  id: number;
  device_id: string;
  hostname: string;
  status: DeviceStatus;
  agent_version: string | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getAgentConfig(isActivated: boolean = true): AgentConfig {
  return {
    heartbeat_interval_seconds: config.agent.heartbeatInterval,
    inventory_interval_minutes: 30, // 30 minutos
    command_poll_interval_seconds: 30,
    realtime_snapshot_interval_seconds: 10,
    is_activated: isActivated,
  };
}

// =============================================================================
// ENROLLMENT SERVICE
// =============================================================================

export async function enrollDevice(data: EnrollRequest): Promise<EnrollResponse> {
  // Verifica duplicidade por identificadores de hardware
  const duplicateCheck = await checkDuplicateDevice(data);

  if (duplicateCheck.exists) {
    // Dispositivo ja existe - atualiza e retorna tokens se aprovado
    return handleExistingDevice(duplicateCheck.device!, data);
  }

  // Novo dispositivo - cria registro
  return createNewDevice(data);
}

async function checkDuplicateDevice(
  data: EnrollRequest
): Promise<{ exists: boolean; device?: DeviceRow; matchType?: string }> {
  // Prioridade 1: device_id exato
  let device = await queryOne<DeviceRow>(
    `SELECT id, device_id, hostname, status, agent_version FROM devices WHERE device_id = ?`,
    [data.device_id]
  );
  if (device) return { exists: true, device, matchType: 'device_id' };

  // Prioridade 2: Serial BIOS
  if (data.serial_bios) {
    device = await queryOne<DeviceRow>(
      `SELECT id, device_id, hostname, status, agent_version FROM devices WHERE serial_bios = ?`,
      [data.serial_bios]
    );
    if (device) return { exists: true, device, matchType: 'serial_bios' };
  }

  // Prioridade 3: System UUID
  if (data.system_uuid) {
    device = await queryOne<DeviceRow>(
      `SELECT id, device_id, hostname, status, agent_version FROM devices WHERE system_uuid = ?`,
      [data.system_uuid]
    );
    if (device) return { exists: true, device, matchType: 'system_uuid' };
  }

  // Prioridade 4: MAC Address (menos confiavel)
  if (data.primary_mac_address) {
    device = await queryOne<DeviceRow>(
      `SELECT id, device_id, hostname, status, agent_version FROM devices WHERE primary_mac_address = ?`,
      [data.primary_mac_address]
    );
    if (device) return { exists: true, device, matchType: 'mac_address' };
  }

  return { exists: false };
}

async function handleExistingDevice(
  existingDevice: DeviceRow,
  data: EnrollRequest
): Promise<EnrollResponse> {
  logAgentActivity(existingDevice.device_id, 'RE_ENROLLMENT', {
    hostname: data.hostname,
    newDeviceId: data.device_id,
  });

  // Atualiza device_id se mudou (reinstalacao)
  if (existingDevice.device_id !== data.device_id) {
    await execute(
      `UPDATE devices SET device_id = ?, hostname = ?, agent_version = ?, updated_at = NOW() WHERE id = ?`,
      [data.device_id, data.hostname, data.agent_version, existingDevice.id]
    );
  }

  // Se bloqueado, retorna status
  if (existingDevice.status === DeviceStatus.BLOCKED) {
    return {
      status: 'blocked',
      message: 'Dispositivo bloqueado. Entre em contato com o administrador.',
    };
  }

  // Se pendente, retorna status
  if (existingDevice.status === DeviceStatus.PENDING) {
    return {
      status: 'pending',
      message: 'Dispositivo aguardando aprovacao do administrador.',
    };
  }

  // Dispositivo aprovado - gera novos tokens
  const tokens = await generateAndSaveTokens(existingDevice.id, data.device_id, data.hostname);

  return {
    status: 'approved',
    message: 'Dispositivo reconectado com sucesso.',
    device_internal_id: existingDevice.id,
    agent_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    config: getAgentConfig(),
  };
}

async function createNewDevice(data: EnrollRequest): Promise<EnrollResponse> {
  const status = config.agent.autoApproveDevices ? DeviceStatus.APPROVED : DeviceStatus.PENDING;

  const deviceId = await insert(
    `INSERT INTO devices
      (device_id, hostname, serial_bios, system_uuid, primary_mac_address,
       os_name, os_version, os_build, os_architecture, agent_version,
       assigned_user, status, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.device_id,
      data.hostname,
      data.serial_bios ?? null,
      data.system_uuid ?? null,
      data.primary_mac_address ?? null,
      data.os_name ?? null,
      data.os_version ?? null,
      data.os_build ?? null,
      data.os_architecture ?? null,
      data.agent_version,
      data.current_user ?? null,
      status,
      status === DeviceStatus.APPROVED ? new Date() : null,
    ]
  );

  logAgentActivity(data.device_id, 'NEW_ENROLLMENT', {
    hostname: data.hostname,
    status,
    autoApproved: config.agent.autoApproveDevices,
  });

  if (status === DeviceStatus.APPROVED) {
    // Auto-aprovado - gera tokens
    const tokens = await generateAndSaveTokens(deviceId, data.device_id, data.hostname);

    return {
      status: 'approved',
      message: 'Dispositivo registrado e aprovado automaticamente.',
      device_internal_id: deviceId,
      agent_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      config: getAgentConfig(),
    };
  }

  return {
    status: 'pending',
    message: 'Dispositivo registrado. Aguardando aprovacao do administrador.',
    device_internal_id: deviceId,
  };
}

async function generateAndSaveTokens(
  deviceInternalId: number,
  deviceId: string,
  hostname: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateAgentAccessToken(deviceInternalId, deviceId, hostname);
  const refreshToken = generateAgentRefreshToken(deviceInternalId, deviceId, hostname);

  // Revoga tokens anteriores
  await execute(
    `UPDATE device_credentials SET revoked_at = NOW(), revoke_reason = 'New token issued' WHERE device_id = ? AND revoked_at IS NULL`,
    [deviceInternalId]
  );

  // Salva novo token
  await insert(
    `INSERT INTO device_credentials (device_id, agent_token_hash, refresh_token_hash) VALUES (?, ?, ?)`,
    [deviceInternalId, hashAgentToken(accessToken), hashAgentToken(refreshToken)]
  );

  return { accessToken, refreshToken };
}

// =============================================================================
// ENROLLMENT STATUS
// =============================================================================

export async function getEnrollmentStatus(deviceId: string): Promise<EnrollResponse> {
  const device = await queryOne<DeviceRow>(
    `SELECT id, device_id, hostname, status, agent_version FROM devices WHERE device_id = ?`,
    [deviceId]
  );

  if (!device) {
    throw new NotFoundError('Dispositivo', deviceId);
  }

  if (device.status === DeviceStatus.BLOCKED) {
    return {
      status: 'blocked',
      message: 'Dispositivo bloqueado.',
    };
  }

  if (device.status === DeviceStatus.PENDING) {
    return {
      status: 'pending',
      message: 'Aguardando aprovacao do administrador.',
    };
  }

  // Aprovado - gera novos tokens
  const tokens = await generateAndSaveTokens(device.id, device.device_id, device.hostname);

  return {
    status: 'approved',
    message: 'Dispositivo aprovado.',
    device_internal_id: device.id,
    agent_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    config: getAgentConfig(),
  };
}

// =============================================================================
// HEARTBEAT SERVICE
// =============================================================================

export async function processHeartbeat(
  deviceInternalId: number,
  data: HeartbeatRequest,
  ipAddress?: string
): Promise<HeartbeatResponse> {
  // Atualiza last_seen e status para online
  await execute(
    `UPDATE devices SET
      last_seen_at = NOW(),
      status = CASE WHEN status IN ('offline', 'approved') THEN 'online' ELSE status END,
      agent_version = COALESCE(?, agent_version),
      assigned_user = COALESCE(?, assigned_user),
      updated_at = NOW()
     WHERE id = ?`,
    [data.agent_version ?? null, data.current_user ?? null, deviceInternalId]
  );

  // Salva heartbeat no historico
  await insert(
    `INSERT INTO device_heartbeats
      (device_id, cpu_usage_percent, ram_usage_percent, disk_free_gb, uptime_seconds, logged_user, agent_version, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deviceInternalId,
      data.cpu_usage_percent ?? null,
      data.ram_usage_percent ?? null,
      data.disk_free_gb ?? null,
      data.uptime_seconds ?? null,
      data.current_user ?? null,
      data.agent_version ?? null,
      ipAddress ?? null,
    ]
  );

  // Atualiza metricas diarias
  await updateDailyMetrics(deviceInternalId, data.current_user);

  // Verifica se ha comandos pendentes
  const pendingCount = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM commands WHERE device_id = ? AND status = 'pending'`,
    [deviceInternalId]
  );

  return {
    accepted: true,
    server_time: new Date().toISOString(),
    has_pending_commands: (pendingCount?.count ?? 0) > 0,
    config_changed: false,
  };
}

// Atualiza metricas diarias do dispositivo
async function updateDailyMetrics(deviceInternalId: number, currentUser?: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Tenta inserir ou atualizar metrica do dia
  await execute(
    `INSERT INTO device_daily_metrics
      (device_id, metric_date, heartbeat_count, first_seen_at, last_seen_at, users_logged)
     VALUES (?, ?, 1, NOW(), NOW(), ?)
     ON DUPLICATE KEY UPDATE
      heartbeat_count = heartbeat_count + 1,
      last_seen_at = NOW(),
      users_logged = CASE
        WHEN ? IS NOT NULL AND (users_logged IS NULL OR NOT JSON_CONTAINS(users_logged, JSON_QUOTE(?)))
        THEN JSON_ARRAY_APPEND(COALESCE(users_logged, '[]'), '$', ?)
        ELSE users_logged
      END`,
    [
      deviceInternalId,
      today,
      currentUser ? JSON.stringify([currentUser]) : '[]',
      currentUser,
      currentUser,
      currentUser,
    ]
  );
}

// =============================================================================
// INVENTORY SERVICE
// =============================================================================

export async function processInventory(
  deviceInternalId: number,
  data: InventoryRequest
): Promise<InventoryResponse> {
  let changesDetected = false;

  await transaction(async (conn: PoolConnection) => {
    // Processa hardware
    if (data.hardware) {
      await processHardwareInventory(conn, deviceInternalId, data.hardware);
      changesDetected = true;
    }

    // Processa discos
    if (data.disks && data.disks.length > 0) {
      await processDiskInventory(conn, deviceInternalId, data.disks);
      changesDetected = true;
    }

    // Processa rede
    if (data.network && data.network.length > 0) {
      await processNetworkInventory(conn, deviceInternalId, data.network);
      changesDetected = true;
    }

    // Processa software
    if (data.software && data.software.length > 0) {
      await processSoftwareInventory(conn, deviceInternalId, data.software);
      changesDetected = true;
    }

    // Atualiza last_inventory_at
    await conn.execute(
      `UPDATE devices SET last_inventory_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [deviceInternalId]
    );
  });

  logAgentActivity(data.device_id, 'INVENTORY_RECEIVED', {
    hasHardware: !!data.hardware,
    diskCount: data.disks?.length ?? 0,
    networkCount: data.network?.length ?? 0,
    softwareCount: data.software?.length ?? 0,
  });

  const nextInventoryDate = new Date();
  nextInventoryDate.setHours(nextInventoryDate.getHours() + config.agent.inventoryInterval);

  return {
    received: true,
    changes_detected: changesDetected,
    next_inventory_at: nextInventoryDate.toISOString(),
  };
}

async function processHardwareInventory(
  conn: PoolConnection,
  deviceId: number,
  hardware: InventoryRequest['hardware']
): Promise<void> {
  if (!hardware) return;

  // Remove hardware anterior
  await conn.execute(`DELETE FROM device_hardware WHERE device_id = ?`, [deviceId]);

  // Insere novo
  await conn.execute(
    `INSERT INTO device_hardware
      (device_id, cpu_model, cpu_cores, cpu_threads, cpu_max_clock_mhz, cpu_architecture,
       ram_total_gb, ram_slots_used, ram_slots_total, gpu_model, gpu_memory_gb,
       motherboard_manufacturer, motherboard_model, bios_version, bios_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deviceId,
      hardware.cpu_model ?? null,
      hardware.cpu_cores ?? null,
      hardware.cpu_threads ?? null,
      hardware.cpu_max_clock_mhz ?? null,
      hardware.cpu_architecture ?? null,
      hardware.ram_total_gb ?? null,
      hardware.ram_slots_used ?? null,
      hardware.ram_slots_total ?? null,
      hardware.gpu_model ?? null,
      hardware.gpu_memory_gb ?? null,
      hardware.motherboard_manufacturer ?? null,
      hardware.motherboard_model ?? null,
      hardware.bios_version ?? null,
      hardware.bios_date ?? null,
    ]
  );
}

async function processDiskInventory(
  conn: PoolConnection,
  deviceId: number,
  disks: NonNullable<InventoryRequest['disks']>
): Promise<void> {
  // Remove discos anteriores
  await conn.execute(`DELETE FROM device_disks WHERE device_id = ?`, [deviceId]);

  // Insere novos
  for (const disk of disks) {
    await conn.execute(
      `INSERT INTO device_disks
        (device_id, drive_letter, volume_label, disk_type, file_system,
         total_gb, free_gb, used_percent, serial_number, model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceId,
        disk.drive_letter ?? null,
        disk.volume_label ?? null,
        disk.disk_type,
        disk.file_system ?? null,
        disk.total_gb,
        disk.free_gb,
        disk.used_percent,
        disk.serial_number ?? null,
        disk.model ?? null,
      ]
    );
  }
}

async function processNetworkInventory(
  conn: PoolConnection,
  deviceId: number,
  networks: NonNullable<InventoryRequest['network']>
): Promise<void> {
  // Remove interfaces anteriores
  await conn.execute(`DELETE FROM device_network WHERE device_id = ?`, [deviceId]);

  // Insere novas
  for (const net of networks) {
    await conn.execute(
      `INSERT INTO device_network
        (device_id, interface_name, interface_type, mac_address,
         ipv4_address, ipv4_subnet, ipv4_gateway, ipv6_address, dns_servers,
         is_primary, is_dhcp_enabled, speed_mbps, wifi_ssid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deviceId,
        net.interface_name,
        net.interface_type,
        net.mac_address ?? null,
        net.ipv4_address ?? null,
        net.ipv4_subnet ?? null,
        net.ipv4_gateway ?? null,
        net.ipv6_address ?? null,
        net.dns_servers ? JSON.stringify(net.dns_servers) : null,
        net.is_primary,
        net.is_dhcp_enabled ?? null,
        net.speed_mbps ?? null,
        net.wifi_ssid ?? null,
      ]
    );
  }
}

function parseInstallDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  // Tenta fazer parse da data
  const date = new Date(dateStr);

  // Verifica se a data e valida
  if (isNaN(date.getTime())) return null;

  // Verifica se os componentes sao validos (ano, mes, dia)
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Ano razoavel (1970-2100)
  if (year < 1970 || year > 2100) return null;

  // Retorna no formato MySQL (YYYY-MM-DD)
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function processSoftwareInventory(
  conn: PoolConnection,
  deviceId: number,
  software: NonNullable<InventoryRequest['software']>
): Promise<void> {
  // Remove software anterior
  await conn.execute(`DELETE FROM device_software WHERE device_id = ?`, [deviceId]);

  // Insere novos (em lotes para performance)
  const batchSize = 100;
  for (let i = 0; i < software.length; i += batchSize) {
    const batch = software.slice(i, i + batchSize);

    for (const sw of batch) {
      await conn.execute(
        `INSERT INTO device_software
          (device_id, name, version, publisher, install_date, install_location, size_mb, is_system_component)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deviceId,
          sw.name,
          sw.version ?? null,
          sw.publisher ?? null,
          parseInstallDate(sw.install_date),
          sw.install_location ?? null,
          sw.size_mb ?? null,
          sw.is_system_component ?? false,
        ]
      );
    }
  }
}

// =============================================================================
// COMMANDS SERVICE
// =============================================================================

export async function getPendingCommands(deviceInternalId: number): Promise<CommandResponse[]> {
  const commands = await query<{
    id: number;
    type: string;
    payload: string | null;
    priority: number;
    expires_at: Date | null;
  }>(
    `SELECT id, type, payload, priority, expires_at
     FROM commands
     WHERE device_id = ? AND status = 'pending'
     ORDER BY priority DESC, created_at ASC`,
    [deviceInternalId]
  );

  // Marca como enviados
  if (commands.length > 0) {
    const ids = commands.map((c) => c.id);
    await execute(
      `UPDATE commands SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id IN (${ids.join(',')})`,
      []
    );
  }

  return commands.map((cmd) => ({
    id: cmd.id,
    type: cmd.type,
    payload: cmd.payload ? JSON.parse(cmd.payload) : null,
    priority: cmd.priority,
    expires_at: cmd.expires_at?.toISOString() ?? null,
  }));
}

export async function saveCommandResult(
  deviceInternalId: number,
  commandId: number,
  data: CommandResultRequest
): Promise<void> {
  // Verifica se o comando pertence ao device
  const command = await queryOne<{ device_id: number }>(
    `SELECT device_id FROM commands WHERE id = ?`,
    [commandId]
  );

  if (!command || command.device_id !== deviceInternalId) {
    throw new NotFoundError('Comando', commandId);
  }

  // Insere resultado
  await insert(
    `INSERT INTO command_results
      (command_id, success, exit_code, stdout, stderr, execution_time_ms, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      commandId,
      data.success,
      data.exit_code ?? null,
      data.stdout ?? null,
      data.stderr ?? null,
      data.execution_time_ms ?? null,
      data.error_message ?? null,
    ]
  );

  // Atualiza status do comando
  const newStatus = data.success ? CommandStatus.COMPLETED : CommandStatus.FAILED;
  await execute(`UPDATE commands SET status = ?, updated_at = NOW() WHERE id = ?`, [
    newStatus,
    commandId,
  ]);

  logger.info('Resultado de comando recebido', {
    commandId,
    success: data.success,
    executionTime: data.execution_time_ms,
  });
}

// =============================================================================
// EVENTS SERVICE
// =============================================================================

export async function saveEvents(
  deviceInternalId: number,
  data: EventsRequest
): Promise<number> {
  let savedCount = 0;

  for (const event of data.events) {
    try {
      await insert(
        `INSERT INTO events
          (device_id, type, severity, message, details, source, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          deviceInternalId,
          event.type,
          event.severity,
          event.message,
          event.details ? JSON.stringify(event.details) : null,
          event.source ?? null,
          event.occurred_at,
        ]
      );
      savedCount++;
    } catch (error) {
      logger.error('Falha ao salvar evento', { error, event });
    }
  }

  return savedCount;
}

// =============================================================================
// SNAPSHOT SERVICE (Tempo Real)
// =============================================================================

export async function processSnapshot(
  deviceInternalId: number,
  data: SnapshotRequest
): Promise<SnapshotResponse> {
  // Insere snapshot no historico
  await insert(
    `INSERT INTO device_snapshots
      (device_id, cpu_usage_percent, cpu_temperature, ram_usage_percent,
       ram_used_gb, ram_available_gb, gpu_usage_percent, gpu_temperature,
       network_bytes_sent, network_bytes_received, network_send_speed_mbps,
       network_receive_speed_mbps, uptime_seconds, \`current_user\`, collected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      deviceInternalId,
      data.cpu_usage_percent ?? null,
      data.cpu_temperature ?? null,
      data.ram_usage_percent ?? null,
      data.ram_used_gb ?? null,
      data.ram_available_gb ?? null,
      data.gpu_usage_percent ?? null,
      data.gpu_temperature ?? null,
      data.network?.bytes_sent ?? null,
      data.network?.bytes_received ?? null,
      data.network?.send_speed_mbps ?? null,
      data.network?.receive_speed_mbps ?? null,
      data.uptime_seconds ?? null,
      data.current_user ?? null,
    ]
  );

  // Atualiza metricas no device principal
  await execute(
    `UPDATE devices SET
      last_snapshot_at = NOW(),
      last_cpu_percent = ?,
      last_ram_percent = ?,
      uptime_seconds = ?,
      assigned_user = COALESCE(?, assigned_user),
      updated_at = NOW()
     WHERE id = ?`,
    [
      data.cpu_usage_percent ?? null,
      data.ram_usage_percent ?? null,
      data.uptime_seconds ?? null,
      data.current_user ?? null,
      deviceInternalId,
    ]
  );

  return { received: true };
}
