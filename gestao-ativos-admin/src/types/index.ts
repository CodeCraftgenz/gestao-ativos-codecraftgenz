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
