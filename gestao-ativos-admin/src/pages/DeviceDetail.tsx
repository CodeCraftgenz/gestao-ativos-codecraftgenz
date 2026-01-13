import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Package,
  Calendar,
  Activity,
  Shield,
  Ban,
  Check,
  RefreshCw,
  AlertCircle,
  Globe,
  Server,
  MemoryStick,
  Gauge,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { devicesService } from '../services/devices.service';
import { StatusBadge } from '../components/StatusBadge';
import type { Device, DeviceHardware, DeviceDisk, DeviceNetwork, DeviceSoftware } from '../types';

interface DeviceDetailData extends Device {
  hardware?: DeviceHardware;
  disks?: DeviceDisk[];
  network?: DeviceNetwork[];
  software?: DeviceSoftware[];
}

export function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'hardware' | 'network' | 'software'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadDevice();
    }
  }, [id]);

  const loadDevice = async () => {
    try {
      setIsLoading(true);
      const data = await devicesService.getById(Number(id));
      setDevice(data);
    } catch {
      setError('Erro ao carregar dispositivo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!device) return;
    try {
      setActionLoading(true);
      await devicesService.approve(device.id);
      loadDevice();
    } catch {
      setError('Erro ao aprovar dispositivo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!device) return;
    const reason = prompt('Motivo do bloqueio:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await devicesService.block(device.id, reason);
      loadDevice();
    } catch {
      setError('Erro ao bloquear dispositivo');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!device) return;
    try {
      setActionLoading(true);
      await devicesService.unblock(device.id);
      loadDevice();
    } catch {
      setError('Erro ao desbloquear dispositivo');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const formatBytes = (gb: number | string | null | undefined) => {
    if (gb === null || gb === undefined) return '-';
    const num = typeof gb === 'string' ? parseFloat(gb) : gb;
    if (isNaN(num)) return '-';
    return `${num.toFixed(1)} GB`;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <AlertCircle />
        </div>
        <h3 className="empty-state-title">{error || 'Dispositivo nao encontrado'}</h3>
        <button type="button" onClick={() => navigate('/devices')} className="btn btn-primary mt-4">
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost" title="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="page-title">{device.hostname}</h1>
                <StatusBadge status={device.status} />
              </div>
              <p className="page-description">
                {device.os_name} {device.os_version} | {device.os_architecture}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {device.status === 'online' && (
              <Link to={`/devices/${device.id}/realtime`} className="btn btn-primary">
                <Gauge size={18} />
                Tempo Real
              </Link>
            )}
            <button type="button" onClick={loadDevice} className="btn btn-secondary" disabled={actionLoading}>
              <RefreshCw size={18} />
              Atualizar
            </button>
            {device.status === 'pending' && (
              <button type="button" onClick={handleApprove} className="btn btn-success" disabled={actionLoading}>
                <Check size={18} />
                Aprovar
              </button>
            )}
            {device.status === 'blocked' ? (
              <button type="button" onClick={handleUnblock} className="btn btn-primary" disabled={actionLoading}>
                <Shield size={18} />
                Desbloquear
              </button>
            ) : (
              device.status !== 'pending' && (
                <button type="button" onClick={handleBlock} className="btn btn-danger" disabled={actionLoading}>
                  <Ban size={18} />
                  Bloquear
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <button
          type="button"
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Monitor size={18} />
          Visao Geral
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'hardware' ? 'active' : ''}`}
          onClick={() => setActiveTab('hardware')}
        >
          <Cpu size={18} />
          Hardware
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <Wifi size={18} />
          Rede
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'software' ? 'active' : ''}`}
          onClick={() => setActiveTab('software')}
        >
          <Package size={18} />
          Software
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Identificacao */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Identificacao</h2>
              <Server size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Device ID</span>
                  <span className="info-value font-mono text-sm">{device.device_id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Hostname</span>
                  <span className="info-value">{device.hostname}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Serial BIOS</span>
                  <span className="info-value font-mono">{device.serial_bios || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">MAC Address</span>
                  <span className="info-value font-mono">{device.primary_mac_address || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Usuario Logado</span>
                  <span className="info-value">{device.assigned_user || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sistema Operacional */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Sistema Operacional</h2>
              <Monitor size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Sistema</span>
                  <span className="info-value">{device.os_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Versao</span>
                  <span className="info-value">{device.os_version || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Build</span>
                  <span className="info-value font-mono">{device.os_build || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Arquitetura</span>
                  <span className="info-value">{device.os_architecture || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status e Atividade */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Status e Atividade</h2>
              <Activity size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Status Atual</span>
                  <StatusBadge status={device.status} />
                </div>
                <div className="info-item">
                  <span className="info-label">Versao do Agente</span>
                  <span className="info-value">{device.agent_version || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ultimo Heartbeat</span>
                  <span className="info-value">{formatDate(device.last_seen_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ultimo Inventario</span>
                  <span className="info-value">{formatDate(device.last_inventory_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Historico</h2>
              <Calendar size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Primeiro Registro</span>
                  <span className="info-value">{formatDate(device.created_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Aprovado Em</span>
                  <span className="info-value">{formatDate(device.approved_at)}</span>
                </div>
                {device.blocked_at && (
                  <>
                    <div className="info-item">
                      <span className="info-label">Bloqueado Em</span>
                      <span className="info-value">{formatDate(device.blocked_at)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Motivo Bloqueio</span>
                      <span className="info-value text-red-500">{device.block_reason}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Tab */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Processador</h2>
              <Cpu size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Modelo</span>
                  <span className="info-value">{device.hardware?.cpu_model || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nucleos</span>
                  <span className="info-value">{device.hardware?.cpu_cores || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Threads</span>
                  <span className="info-value">{device.hardware?.cpu_threads || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Clock Maximo</span>
                  <span className="info-value">
                    {device.hardware?.cpu_max_clock_mhz ? `${device.hardware.cpu_max_clock_mhz} MHz` : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Memoria */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Memoria RAM</h2>
              <MemoryStick size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Total</span>
                  <span className="info-value">{formatBytes(device.hardware?.ram_total_gb)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Slots Usados</span>
                  <span className="info-value">
                    {device.hardware?.ram_slots_used ?? '-'} / {device.hardware?.ram_slots_total ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GPU */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Placa de Video</h2>
              <Monitor size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Modelo</span>
                  <span className="info-value">{device.hardware?.gpu_model || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Memoria</span>
                  <span className="info-value">{formatBytes(device.hardware?.gpu_memory_gb)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Placa Mae / BIOS */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Placa Mae / BIOS</h2>
              <Server size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Fabricante</span>
                  <span className="info-value">{device.hardware?.motherboard_manufacturer || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Modelo</span>
                  <span className="info-value">{device.hardware?.motherboard_model || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">BIOS</span>
                  <span className="info-value">{device.hardware?.bios_version || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Data BIOS</span>
                  <span className="info-value">{device.hardware?.bios_date || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discos */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h2 className="card-title">Armazenamento</h2>
              <HardDrive size={20} className="text-gray-400" />
            </div>
            <div className="card-body">
              {device.disks && device.disks.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Unidade</th>
                        <th>Tipo</th>
                        <th>Total</th>
                        <th>Livre</th>
                        <th>Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {device.disks.map((disk, index) => (
                        <tr key={index}>
                          <td>
                            <div className="font-medium">{disk.drive_letter}</div>
                            <div className="text-sm text-gray-500">{disk.volume_label || '-'}</div>
                          </td>
                          <td>{disk.disk_type}</td>
                          <td>{formatBytes(disk.total_gb)}</td>
                          <td>{formatBytes(disk.free_gb)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="progress-bar-container">
                                <div
                                  className={`progress-bar ${parseFloat(String(disk.used_percent)) > 90 ? 'danger' : parseFloat(String(disk.used_percent)) > 70 ? 'warning' : 'success'}`}
                                  style={{ width: `${disk.used_percent}%` }}
                                />
                              </div>
                              <span className="text-sm">{parseFloat(String(disk.used_percent))?.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-small">
                  <HardDrive size={24} className="text-gray-400" />
                  <span>Nenhum disco encontrado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Network Tab */}
      {activeTab === 'network' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Interfaces de Rede</h2>
            <Globe size={20} className="text-gray-400" />
          </div>
          <div className="card-body">
            {device.network && device.network.length > 0 ? (
              <div className="space-y-4">
                {device.network.map((net, index) => (
                  <div key={index} className={`network-card ${net.is_primary ? 'primary' : ''}`}>
                    <div className="network-header">
                      <div className="flex items-center gap-2">
                        <Wifi size={18} />
                        <span className="font-medium">{net.interface_name}</span>
                        {net.is_primary && <span className="badge badge-info">Principal</span>}
                      </div>
                      <span className="badge badge-secondary">{net.interface_type}</span>
                    </div>
                    <div className="network-body">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">MAC Address</span>
                          <span className="info-value font-mono">{net.mac_address || '-'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">IPv4</span>
                          <span className="info-value font-mono">{net.ipv4_address || '-'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Mascara</span>
                          <span className="info-value font-mono">{net.ipv4_subnet || '-'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Gateway</span>
                          <span className="info-value font-mono">{net.ipv4_gateway || '-'}</span>
                        </div>
                        {net.wifi_ssid && (
                          <div className="info-item">
                            <span className="info-label">Wi-Fi SSID</span>
                            <span className="info-value">{net.wifi_ssid}</span>
                          </div>
                        )}
                        {net.speed_mbps && (
                          <div className="info-item">
                            <span className="info-label">Velocidade</span>
                            <span className="info-value">{net.speed_mbps} Mbps</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-small">
                <Wifi size={24} className="text-gray-400" />
                <span>Nenhuma interface de rede encontrada</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Software Tab */}
      {activeTab === 'software' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Software Instalado</h2>
            <Package size={20} className="text-gray-400" />
          </div>
          <div className="card-body">
            {device.software && device.software.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Versao</th>
                      <th>Editor</th>
                      <th>Data Instalacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.software.map((sw, index) => (
                      <tr key={index}>
                        <td className="font-medium">{sw.name}</td>
                        <td className="font-mono text-sm">{sw.version || '-'}</td>
                        <td>{sw.publisher || '-'}</td>
                        <td className="text-sm text-gray-500">{formatDate(sw.install_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-small">
                <Package size={24} className="text-gray-400" />
                <span>Nenhum software encontrado</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
