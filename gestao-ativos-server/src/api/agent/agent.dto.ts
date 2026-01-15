import { z } from 'zod';

// =============================================================================
// ENROLLMENT
// =============================================================================

export const enrollRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  hostname: z.string().min(1, 'hostname e obrigatorio').max(255),
  serial_bios: z.string().max(255).nullable().optional(),
  system_uuid: z.string().max(100).nullable().optional(),
  primary_mac_address: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'MAC address invalido')
    .nullable()
    .optional(),
  os_name: z.string().max(100).nullable().optional(),
  os_version: z.string().max(100).nullable().optional(),
  os_build: z.string().max(50).nullable().optional(),
  os_architecture: z.enum(['x86', 'x64', 'X64', 'ARM64', 'arm64']).nullable().optional(),
  agent_version: z.string().min(1, 'agent_version e obrigatorio').max(20),
  current_user: z.string().max(255).nullable().optional(),
  domain: z.string().max(255).nullable().optional(),
});

export type EnrollRequest = z.infer<typeof enrollRequestSchema>;

export interface EnrollResponse {
  status: 'pending' | 'approved' | 'blocked' | 'standby' | 'active';
  message: string;
  device_internal_id?: number;
  agent_token?: string;
  refresh_token?: string;
  config?: AgentConfig;
}

export interface AgentConfig {
  heartbeat_interval_seconds: number;
  inventory_interval_minutes: number; // Alterado de hours para minutes
  command_poll_interval_seconds: number;
  realtime_snapshot_interval_seconds: number;
  is_activated: boolean;
}

// =============================================================================
// HEARTBEAT
// =============================================================================

export const heartbeatRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  timestamp: z.string().datetime(),
  agent_version: z.string().max(20).optional(),
  uptime_seconds: z.number().int().nonnegative().optional(),
  cpu_usage_percent: z.number().min(0).max(100).optional(),
  ram_usage_percent: z.number().min(0).max(100).optional(),
  disk_free_gb: z.number().nonnegative().optional(),
  current_user: z.string().max(255).optional(),
});

export type HeartbeatRequest = z.infer<typeof heartbeatRequestSchema>;

export interface HeartbeatResponse {
  accepted: boolean;
  server_time: string;
  has_pending_commands: boolean;
  config_changed: boolean;
  new_config?: AgentConfig;
}

// =============================================================================
// INVENTORY
// =============================================================================

export const hardwareInfoSchema = z.object({
  cpu_model: z.string().max(255).nullable().optional(),
  cpu_cores: z.number().int().positive().nullable().optional(),
  cpu_threads: z.number().int().positive().nullable().optional(),
  cpu_max_clock_mhz: z.number().int().positive().nullable().optional(),
  cpu_architecture: z.string().max(20).nullable().optional(),
  ram_total_gb: z.number().nonnegative().nullable().optional(),
  ram_slots_used: z.number().int().nonnegative().nullable().optional(),
  ram_slots_total: z.number().int().nonnegative().nullable().optional(),
  gpu_model: z.string().max(255).nullable().optional(),
  gpu_memory_gb: z.number().nonnegative().nullable().optional(),
  motherboard_manufacturer: z.string().max(255).nullable().optional(),
  motherboard_model: z.string().max(255).nullable().optional(),
  bios_version: z.string().max(100).nullable().optional(),
  bios_date: z.string().max(50).nullable().optional(),
});

export type HardwareInfo = z.infer<typeof hardwareInfoSchema>;

export const diskInfoSchema = z.object({
  drive_letter: z.string().max(10).nullable().optional(),
  volume_label: z.string().max(255).nullable().optional(),
  disk_type: z.enum(['HDD', 'SSD', 'NVMe', 'USB', 'Network', 'Unknown']),
  file_system: z.string().max(20).nullable().optional(),
  total_gb: z.number().nonnegative(),
  free_gb: z.number().nonnegative(),
  used_percent: z.number().min(0).max(100),
  serial_number: z.string().max(255).nullable().optional(),
  model: z.string().max(255).nullable().optional(),
});

export type DiskInfo = z.infer<typeof diskInfoSchema>;

export const networkInfoSchema = z.object({
  interface_name: z.string().max(255),
  interface_type: z.enum(['Ethernet', 'WiFi', 'Virtual', 'Loopback', 'Other']),
  mac_address: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
    .nullable()
    .optional(),
  ipv4_address: z.string().ip({ version: 'v4' }).nullable().optional(),
  ipv4_subnet: z.string().nullable().optional(),
  ipv4_gateway: z.string().ip({ version: 'v4' }).nullable().optional(),
  ipv6_address: z.string().nullable().optional(),
  dns_servers: z.array(z.string()).nullable().optional(),
  is_primary: z.boolean(),
  is_dhcp_enabled: z.boolean().nullable().optional(),
  speed_mbps: z.number().int().nonnegative().nullable().optional(),
  wifi_ssid: z.string().max(255).nullable().optional(),
});

export type NetworkInfo = z.infer<typeof networkInfoSchema>;

export const softwareInfoSchema = z.object({
  name: z.string().max(500),
  version: z.string().max(100).nullable().optional(),
  publisher: z.string().max(255).nullable().optional(),
  install_date: z.string().nullable().optional(),
  install_location: z.string().max(500).nullable().optional(),
  size_mb: z.number().nonnegative().nullable().optional(),
  is_system_component: z.boolean().optional().default(false),
});

export type SoftwareInfo = z.infer<typeof softwareInfoSchema>;

export const inventoryRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  collected_at: z.string().datetime(),
  hardware: hardwareInfoSchema.optional(),
  disks: z.array(diskInfoSchema).optional(),
  network: z.array(networkInfoSchema).optional(),
  software: z.array(softwareInfoSchema).max(5000).optional(),
});

export type InventoryRequest = z.infer<typeof inventoryRequestSchema>;

export interface InventoryResponse {
  received: boolean;
  changes_detected: boolean;
  next_inventory_at: string;
}

// =============================================================================
// COMMANDS
// =============================================================================

export interface CommandResponse {
  id: number;
  type: string;
  payload: Record<string, unknown> | null;
  priority: number;
  expires_at: string | null;
}

export interface PendingCommandsResponse {
  commands: CommandResponse[];
}

export const commandResultRequestSchema = z.object({
  success: z.boolean(),
  exit_code: z.number().int().nullable().optional(),
  stdout: z.string().max(65535).nullable().optional(),
  stderr: z.string().max(65535).nullable().optional(),
  execution_time_ms: z.number().int().nonnegative().nullable().optional(),
  error_message: z.string().max(1000).nullable().optional(),
});

export type CommandResultRequest = z.infer<typeof commandResultRequestSchema>;

// =============================================================================
// EVENTS
// =============================================================================

export const eventSchema = z.object({
  type: z.string().max(50),
  severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  message: z.string().max(1000),
  details: z.record(z.unknown()).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  occurred_at: z.string().datetime(),
});

export type EventDto = z.infer<typeof eventSchema>;

export const eventsRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  events: z.array(eventSchema).min(1).max(100),
});

export type EventsRequest = z.infer<typeof eventsRequestSchema>;

export interface EventsResponse {
  received: number;
}

// =============================================================================
// SNAPSHOT (Tempo Real) - MANTIDO PARA COMPATIBILIDADE, MAS SIMPLIFICADO
// =============================================================================

export const snapshotRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  timestamp: z.string().datetime(),
  cpu_usage_percent: z.number().min(0).max(100).nullable().optional(),
  cpu_core_usages: z.array(z.number().min(0).max(100)).nullable().optional(),
  cpu_temperature: z.number().nullable().optional(),
  ram_usage_percent: z.number().min(0).max(100).nullable().optional(),
  ram_used_gb: z.number().nonnegative().nullable().optional(),
  ram_available_gb: z.number().nonnegative().nullable().optional(),
  gpu_usage_percent: z.number().min(0).max(100).nullable().optional(),
  gpu_memory_usage_percent: z.number().min(0).max(100).nullable().optional(),
  gpu_temperature: z.number().nullable().optional(),
  disks: z
    .array(
      z.object({
        drive_letter: z.string(),
        total_gb: z.number().nonnegative(),
        free_gb: z.number().nonnegative(),
        used_percent: z.number().min(0).max(100),
      })
    )
    .nullable()
    .optional(),
  network: z
    .object({
      bytes_sent: z.number().int().nonnegative(),
      bytes_received: z.number().int().nonnegative(),
      send_speed_mbps: z.number().nonnegative(),
      receive_speed_mbps: z.number().nonnegative(),
    })
    .nullable()
    .optional(),
  current_user: z.string().max(255).nullable().optional(),
  uptime_seconds: z.number().int().nonnegative().optional(),
});

export type SnapshotRequest = z.infer<typeof snapshotRequestSchema>;

export interface SnapshotResponse {
  received: boolean;
}

// =============================================================================
// ACTIVITY EVENTS (BOOT/SHUTDOWN/LOGIN/LOGOUT) - NOVO ENDPOINT PRINCIPAL
// =============================================================================

export const activityEventSchema = z.object({
  event_type: z.enum(['boot', 'shutdown', 'login', 'logout']),
  occurred_at: z.string().datetime(),
  logged_user: z.string().max(255).nullable().optional(),
  duration_seconds: z.number().int().nonnegative().nullable().optional(),
});

export type ActivityEventDto = z.infer<typeof activityEventSchema>;

export const activityEventsRequestSchema = z.object({
  device_id: z.string().uuid('device_id deve ser um UUID valido'),
  events: z.array(activityEventSchema).min(1).max(50),
});

export type ActivityEventsRequest = z.infer<typeof activityEventsRequestSchema>;

export interface ActivityEventsResponse {
  received: number;
}
