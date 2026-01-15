import api from './api';
import type { Device, ApiResponse, PaginatedResponse, DashboardStats, DashboardAnalytics, PreRegisteredDevice, RealTimeData } from '../types';

export interface DeviceFilters {
  status?: string;
  search?: string;
  filial_id?: number;
  page?: number;
  limit?: number;
}

// Interface para snapshot do OverlayCraft
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
  receivedAt: string;
  isOnline?: boolean;
}

export const devicesService = {
  async getAll(filters: DeviceFilters = {}): Promise<PaginatedResponse<Device>> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.filial_id) params.append('filial_id', filters.filial_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Device>>(`/api/admin/devices?${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Device> {
    const response = await api.get<ApiResponse<Device>>(`/api/admin/devices/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Dispositivo não encontrado');
    }
    return response.data.data;
  },

  async getPending(): Promise<Device[]> {
    const response = await api.get<ApiResponse<Device[]>>('/api/admin/devices/pending');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar dispositivos pendentes');
    }
    return response.data.data || [];
  },

  async approve(id: number): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/api/admin/devices/${id}/approve`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao aprovar dispositivo');
    }
  },

  async block(id: number, reason: string): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/api/admin/devices/${id}/block`, { reason });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao bloquear dispositivo');
    }
  },

  async unblock(id: number): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/api/admin/devices/${id}/unblock`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao desbloquear dispositivo');
    }
  },

  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/api/admin/dashboard/stats');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar estatísticas');
    }
    return response.data.data;
  },

  async getAnalytics(): Promise<DashboardAnalytics> {
    const response = await api.get<ApiResponse<DashboardAnalytics>>('/api/admin/dashboard/analytics');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar analytics');
    }
    return response.data.data;
  },

  async sendCommand(deviceId: number, type: string, payload?: object): Promise<void> {
    const response = await api.post<ApiResponse<void>>(`/api/admin/devices/${deviceId}/command`, {
      type,
      payload,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao enviar comando');
    }
  },

  // Busca dispositivo por Service Tag
  async getByServiceTag(serviceTag: string): Promise<Device | null> {
    const response = await api.get<ApiResponse<Device | null>>(`/api/admin/devices/service-tag/${encodeURIComponent(serviceTag)}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar por Service Tag');
    }
    return response.data.data || null;
  },

  // Lista dispositivos pre-registrados
  async getPreRegistered(): Promise<PreRegisteredDevice[]> {
    const response = await api.get<ApiResponse<PreRegisteredDevice[]>>('/api/admin/devices/pre-registered');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar dispositivos pre-registrados');
    }
    return response.data.data || [];
  },

  // Registra dispositivo por Service Tag
  async registerByServiceTag(serviceTag: string, description?: string, filialId?: number): Promise<{ id: number }> {
    const response = await api.post<ApiResponse<{ id: number }>>('/api/admin/devices/register-by-service-tag', {
      serviceTag,
      description,
      filial_id: filialId,
    });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao registrar dispositivo');
    }
    return response.data.data!;
  },

  // Obtem dados em tempo real do OverlayCraft (via conexao direta - legado)
  async getRealTimeData(deviceId: number): Promise<RealTimeData> {
    const response = await api.get<ApiResponse<RealTimeData>>(`/api/admin/devices/${deviceId}/realtime`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar dados em tempo real');
    }
    return response.data.data!;
  },

  // Obtem dados em tempo real do cache de snapshots
  async getRealTimeDataCached(deviceId: number): Promise<OverlayCraftSnapshot> {
    const response = await api.get<ApiResponse<OverlayCraftSnapshot>>(`/api/admin/devices/${deviceId}/realtime-cached`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar dados em tempo real');
    }
    return response.data.data!;
  },

  // Lista todos os snapshots ativos
  async getActiveSnapshots(): Promise<OverlayCraftSnapshot[]> {
    const response = await api.get<ApiResponse<OverlayCraftSnapshot[]>>('/api/admin/snapshots');
    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao buscar snapshots');
    }
    return response.data.data || [];
  },

  // Obtem snapshot por ServiceTag
  async getSnapshotByServiceTag(serviceTag: string): Promise<OverlayCraftSnapshot | null> {
    const response = await api.get<ApiResponse<OverlayCraftSnapshot>>(`/api/admin/snapshots/${encodeURIComponent(serviceTag)}`);
    if (!response.data.success) {
      return null;
    }
    return response.data.data || null;
  },
};
