// Types do sistema

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERADOR' | 'LEITURA';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
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
  last_seen_at: string | null;
  last_inventory_at: string | null;
  approved_at: string | null;
  approved_by: number | null;
  blocked_at: string | null;
  blocked_by: number | null;
  block_reason: string | null;
  filial_id: number | null;
  department: string | null;
  assigned_user: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  filial?: Filial;
  hardware?: DeviceHardware;
}

export type DeviceStatus = 'pending' | 'approved' | 'blocked' | 'offline' | 'online';

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
  collected_at: string;
}

export interface DeviceDisk {
  id: number;
  device_id: number;
  drive_letter: string | null;
  volume_label: string | null;
  disk_type: 'HDD' | 'SSD' | 'NVMe' | 'USB' | 'Network' | 'Unknown';
  file_system: string | null;
  total_gb: number;
  free_gb: number;
  used_percent: number;
  serial_number: string | null;
  model: string | null;
  collected_at: string;
}

export interface DeviceNetwork {
  id: number;
  device_id: number;
  interface_name: string;
  interface_type: 'Ethernet' | 'WiFi' | 'Virtual' | 'Loopback' | 'Other';
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
  collected_at: string;
}

export interface DeviceSoftware {
  id: number;
  device_id: number;
  name: string;
  version: string | null;
  publisher: string | null;
  install_date: string | null;
  install_location: string | null;
  size_mb: number | null;
  is_system_component: boolean;
  collected_at: string;
}

export interface Filial {
  id: number;
  codigo: string;
  descricao: string;
  palavras_chave: string | null;
  ativo: boolean;
}

export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  pendingDevices: number;
  blockedDevices: number;
}

// Dashboard Analytics - Metricas avancadas para graficos
export interface HourlyActivity {
  hour: number;
  heartbeats: number;
  active_devices: number;
}

export interface DeviceHealthSummary {
  online: number;
  offline: number;
  alert: number;
}

export interface DeviceUsageMetric {
  device_id: number;
  hostname: string;
  avg_cpu_percent: number;
  avg_ram_percent: number;
  uptime_hours: number;
  idle_score: number;
}

export interface RecentActivity {
  device_id: number;
  hostname: string;
  assigned_user: string | null;
  ip_address: string | null;
  last_seen_at: string;
  status: DeviceStatus;
  event_type?: string;
}

export interface PlanUsage {
  current_devices: number;
  max_devices: number;
  usage_percent: number;
  plan_name: string;
  retention_days: number;
  near_limit: boolean;
}

// Planos
export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  max_devices: number;
  max_users: number;
  max_filiais: number;
  feature_alerts: boolean;
  feature_reports: boolean;
  feature_geoip: boolean;
  feature_api_access: boolean;
  data_retention_days: number;
  price_monthly_cents: number;
  price_yearly_cents: number;
  is_active: boolean;
  is_default: boolean;
}

// Subscription
export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  started_at: string;
  expires_at: string | null;
  canceled_at: string | null;
  trial_ends_at: string | null;
  external_subscription_id: string | null;
  plan?: Plan;
}

// Register Response
export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  subscription: {
    plan_name: string;
    status: string;
  };
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  hourly_activity: HourlyActivity[];
  health_summary: DeviceHealthSummary;
  usage_metrics: DeviceUsageMetric[];
  recent_activity: RecentActivity[];
  plan_usage: PlanUsage;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pre-registro de dispositivos
export interface PreRegisteredDevice {
  id: number;
  service_tag: string;
  description: string | null;
  filial_id: number | null;
  filial_nome?: string | null;
  registered_by: number;
  registered_by_email?: string;
  registered_at: string;
  enrolled: boolean;
  device_id: number | null;
  enrolled_at: string | null;
}

// Dados em tempo real do OverlayCraft
export interface RealTimeData {
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
