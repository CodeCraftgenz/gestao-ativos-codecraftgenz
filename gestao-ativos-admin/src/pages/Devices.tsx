import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, RefreshCw, Eye, Monitor, AlertCircle } from 'lucide-react';
import type { Device } from '../types';
import { devicesService } from '../services/devices.service';
import type { DeviceFilters } from '../services/devices.service';
import { StatusBadge } from '../components/StatusBadge';

export function Devices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const statusFilter = searchParams.get('status') || '';

  useEffect(() => {
    loadDevices();
  }, [searchParams]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const filters: DeviceFilters = {
        status: statusFilter || undefined,
        search: searchParams.get('search') || undefined,
      };
      const response = await devicesService.getAll(filters);
      setDevices(response.data);
    } catch (err) {
      setError('Erro ao carregar dispositivos');
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    setSearchParams(params);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dispositivos</h1>
            <p className="page-description">Gerenciar todos os dispositivos cadastrados</p>
          </div>
          <button
            type="button"
            onClick={loadDevices}
            className="btn btn-secondary"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} className="filter-search">
          <div className="input-with-icon">
            <Search className="input-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por hostname, serial, IP..."
              className="input"
            />
          </div>
        </form>
        <div className="filter-buttons">
          <button
            type="button"
            onClick={() => handleStatusFilter('')}
            className={`filter-btn ${!statusFilter ? 'active' : ''}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilter('online')}
            className={`filter-btn ${statusFilter === 'online' ? 'active' : ''}`}
          >
            Online
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilter('offline')}
            className={`filter-btn ${statusFilter === 'offline' ? 'active' : ''}`}
          >
            Offline
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilter('pending')}
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => handleStatusFilter('blocked')}
            className={`filter-btn ${statusFilter === 'blocked' ? 'active' : ''}`}
          >
            Bloqueados
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Devices Table */}
      <div className="card">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Monitor />
            </div>
            <h3 className="empty-state-title">Nenhum dispositivo encontrado</h3>
            <p className="empty-state-description">
              Os dispositivos aparecerão aqui após instalação do agente
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Sistema</th>
                  <th>Status</th>
                  <th>Último Acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <div className="device-item">
                        <div className="device-icon">
                          <Monitor />
                        </div>
                        <div className="device-info">
                          <div className="device-name">{device.hostname}</div>
                          <div className="device-meta">
                            {device.serial_bios || device.primary_mac_address || '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="td-primary">{device.os_name || '-'}</div>
                      <div className="td-secondary">{device.os_version || '-'}</div>
                    </td>
                    <td>
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="td-secondary">
                      {formatDate(device.last_seen_at)}
                    </td>
                    <td>
                      <Link
                        to={`/devices/${device.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        <Eye size={16} />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
