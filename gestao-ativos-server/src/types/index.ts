import { Request } from 'express';

// =============================================================================
// ENUMS
// =============================================================================

export enum DeviceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  BLOCKED = 'blocked',
  OFFLINE = 'offline',
  ONLINE = 'online',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  LEITURA = 'LEITURA',
}

export enum CommandType {
  COLLECT_INVENTORY = 'COLLECT_INVENTORY',
  COLLECT_SOFTWARE = 'COLLECT_SOFTWARE',
  SEND_LOGS = 'SEND_LOGS',
  RESTART_AGENT = 'RESTART_AGENT',
  UPDATE_AGENT = 'UPDATE_AGENT',
  EXECUTE_SCRIPT = 'EXECUTE_SCRIPT',
  PING = 'PING',
  SHUTDOWN = 'SHUTDOWN',
  RESTART_PC = 'RESTART_PC',
}

export enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum EventSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum DiskType {
  HDD = 'HDD',
  SSD = 'SSD',
  NVME = 'NVMe',
  USB = 'USB',
  NETWORK = 'Network',
  UNKNOWN = 'Unknown',
}

export enum NetworkInterfaceType {
  ETHERNET = 'Ethernet',
  WIFI = 'WiFi',
  VIRTUAL = 'Virtual',
  LOOPBACK = 'Loopback',
  OTHER = 'Other',
}

// =============================================================================
// ENTITIES
// =============================================================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Device {
  id: number;
  device_id: string;
  hostname: string;
  serial_bios: string | null;
  system_uuid: string | null;
  primary_mac_address: string | null;
  os_name: string | null;
  os_version: string | null;
  os_build: string | null;
  os_architecture: string | null;
  status: DeviceStatus;
  agent_version: string | null;
  last_seen_at: Date | null;
  last_inventory_at: Date | null;
  approved_at: Date | null;
  approved_by: number | null;
  blocked_at: Date | null;
  blocked_by: number | null;
  block_reason: string | null;
  filial_id: number | null;
  department: string | null;
  assigned_user: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface DeviceCredential {
  id: number;
  device_id: number;
  agent_token_hash: string;
  refresh_token_hash: string | null;
  issued_at: Date;
  expires_at: Date | null;
  last_used_at: Date | null;
  revoked_at: Date | null;
  revoked_by: number | null;
  revoke_reason: string | null;
  created_at: Date;
}

export interface DeviceHardware {
  id: number;
  device_id: number;
  cpu_model: string | null;
  cpu_cores: number | null;
  cpu_threads: number | null;
  cpu_max_clock_mhz: number | null;
  cpu_architecture: string | null;
  ram_total_gb: number | null;
  ram_slots_used: number | null;
  ram_slots_total: number | null;
  gpu_model: string | null;
  gpu_memory_gb: number | null;
  motherboard_manufacturer: string | null;
  motherboard_model: string | null;
  bios_version: string | null;
  bios_date: string | null;
  collected_at: Date;
}

export interface DeviceDisk {
  id: number;
  device_id: number;
  drive_letter: string | null;
  volume_label: string | null;
  disk_type: DiskType;
  file_system: string | null;
  total_gb: number;
  free_gb: number;
  used_percent: number;
  serial_number: string | null;
  model: string | null;
  collected_at: Date;
}

export interface DeviceNetwork {
  id: number;
  device_id: number;
  interface_name: string;
  interface_type: NetworkInterfaceType;
  mac_address: string | null;
  ipv4_address: string | null;
  ipv4_subnet: string | null;
  ipv4_gateway: string | null;
  ipv6_address: string | null;
  dns_servers: string[] | null;
  is_primary: boolean;
  is_dhcp_enabled: boolean | null;
  speed_mbps: number | null;
  wifi_ssid: string | null;
  collected_at: Date;
}

export interface DeviceSoftware {
  id: number;
  device_id: number;
  name: string;
  version: string | null;
  publisher: string | null;
  install_date: Date | null;
  install_location: string | null;
  size_mb: number | null;
  is_system_component: boolean;
  uninstall_string: string | null;
  collected_at: Date;
}

export interface Command {
  id: number;
  device_id: number;
  type: CommandType;
  payload: Record<string, unknown> | null;
  priority: number;
  status: CommandStatus;
  created_by: number;
  expires_at: Date | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CommandResult {
  id: number;
  command_id: number;
  success: boolean;
  exit_code: number | null;
  stdout: string | null;
  stderr: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: Date;
}

export interface Event {
  id: number;
  device_id: number;
  type: string;
  severity: EventSeverity;
  message: string;
  details: Record<string, unknown> | null;
  source: string | null;
  occurred_at: Date;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface Filial {
  id: number;
  codigo: string;
  descricao: string;
  palavras_chave: string | null;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// REQUEST EXTENSIONS
// =============================================================================

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthenticatedDevice {
  id: number;
  device_id: string;
  hostname: string;
  status: DeviceStatus;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  device?: AuthenticatedDevice;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// AGENT CONFIG
// =============================================================================

export interface AgentConfig {
  heartbeat_interval_seconds: number;
  inventory_interval_hours: number;
  command_poll_interval_seconds: number;
}

// =============================================================================
// DASHBOARD
// =============================================================================

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  pendingDevices: number;
  blockedDevices: number;
}

// =============================================================================
// DASHBOARD ANALYTICS (Graficos e Metricas Avancadas)
// =============================================================================

export interface HourlyActivity {
  hour: number;
  heartbeats: number;
  active_devices: number;
}

export interface DeviceHealthSummary {
  online: number;
  offline: number;
  alert: number; // Disco > 90% ou sem sinal ha 24h
}

export interface DeviceUsageMetric {
  device_id: number;
  hostname: string;
  avg_cpu_percent: number;
  avg_ram_percent: number;
  uptime_hours: number;
  idle_score: number; // 0-100, quanto maior mais ocioso
}

export interface RecentActivity {
  device_id: number;
  hostname: string;
  assigned_user: string | null;
  ip_address: string | null;
  last_seen_at: Date;
  status: DeviceStatus;
  event_type?: string;
}

export interface PlanUsage {
  current_devices: number;
  max_devices: number;
  usage_percent: number;
  plan_name: string;
  retention_days: number;
  near_limit: boolean; // >= 80%
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  hourly_activity: HourlyActivity[];
  health_summary: DeviceHealthSummary;
  usage_metrics: DeviceUsageMetric[];
  recent_activity: RecentActivity[];
  plan_usage: PlanUsage;
}
