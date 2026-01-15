import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  HardDrive,
  WifiOff,
  Cpu,
  MemoryStick,
  MapPin,
  Shield,
  CheckCircle,
  Bell,
  Settings,
  Save,
  RefreshCw,
} from 'lucide-react';

interface Alert {
  id: number;
  device_id: number;
  device_hostname: string;
  alert_type: 'disk_full' | 'offline' | 'cpu_high' | 'ram_high' | 'unauthorized_location' | 'security';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

interface AlertSettings {
  disk_warning_percent: number;
  disk_critical_percent: number;
  cpu_warning_percent: number;
  ram_warning_percent: number;
  offline_warning_minutes: number;
  offline_critical_minutes: number;
  email_notifications: boolean;
}

const alertTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  disk_full: { icon: HardDrive, label: 'Disco Cheio' },
  offline: { icon: WifiOff, label: 'Dispositivo Offline' },
  cpu_high: { icon: Cpu, label: 'CPU Alta' },
  ram_high: { icon: MemoryStick, label: 'RAM Alta' },
  unauthorized_location: { icon: MapPin, label: 'Localizacao Suspeita' },
  security: { icon: Shield, label: 'Seguranca' },
};

const severityConfig: Record<string, { badge: string; icon: React.ElementType }> = {
  info: { badge: 'badge-info', icon: Info },
  warning: { badge: 'badge-warning', icon: AlertCircle },
  critical: { badge: 'badge-danger', icon: AlertTriangle },
};

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    disk_warning_percent: 80,
    disk_critical_percent: 95,
    cpu_warning_percent: 90,
    ram_warning_percent: 90,
    offline_warning_minutes: 60,
    offline_critical_minutes: 1440,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Mock data
      setAlerts([
        {
          id: 1,
          device_id: 1,
          device_hostname: 'PC-RECEPCAO-01',
          alert_type: 'disk_full',
          severity: 'critical',
          title: 'Disco quase cheio',
          message: 'O disco C: esta com 96% de uso. Libere espaco para evitar problemas.',
          status: 'active',
          created_at: new Date(Date.now() - 30 * 60000).toISOString(),
          acknowledged_at: null,
          resolved_at: null,
        },
        {
          id: 2,
          device_id: 2,
          device_hostname: 'NOTEBOOK-VENDAS-03',
          alert_type: 'offline',
          severity: 'warning',
          title: 'Dispositivo offline',
          message: 'Sem comunicacao ha mais de 2 horas.',
          status: 'active',
          created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
          acknowledged_at: null,
          resolved_at: null,
        },
        {
          id: 3,
          device_id: 3,
          device_hostname: 'SERVER-BACKUP',
          alert_type: 'cpu_high',
          severity: 'warning',
          title: 'CPU em uso elevado',
          message: 'CPU acima de 90% por mais de 15 minutos.',
          status: 'acknowledged',
          created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
          acknowledged_at: new Date(Date.now() - 3 * 3600000).toISOString(),
          resolved_at: null,
        },
        {
          id: 4,
          device_id: 4,
          device_hostname: 'PC-FINANCEIRO-02',
          alert_type: 'unauthorized_location',
          severity: 'critical',
          title: 'Localizacao suspeita',
          message: 'Dispositivo acessado de IP em cidade diferente do habitual.',
          status: 'resolved',
          created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
          acknowledged_at: new Date(Date.now() - 23 * 3600000).toISOString(),
          resolved_at: new Date(Date.now() - 22 * 3600000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Configuracoes salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  }

  async function acknowledgeAlert(alertId: number) {
    setAlerts(alerts.map(a =>
      a.id === alertId ? { ...a, status: 'acknowledged', acknowledged_at: new Date().toISOString() } : a
    ));
  }

  async function resolveAlert(alertId: number) {
    setAlerts(alerts.map(a =>
      a.id === alertId ? { ...a, status: 'resolved', resolved_at: new Date().toISOString() } : a
    ));
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}min atras`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    return `${days}d atras`;
  }

  const filteredAlerts = alerts.filter(a => filter === 'all' || a.status === filter);
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Central de Alertas</h1>
            <p className="page-description">Monitore problemas e tome acoes preventivas</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary"
          >
            <Settings size={18} />
            {showSettings ? 'Fechar Configuracoes' : 'Configurar Alertas'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-6">
        <div className="stat-card yellow">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Bell />
            </div>
          </div>
          <div className="stat-card-value">{activeCount}</div>
          <div className="stat-card-label">Alertas Ativos</div>
        </div>

        <div className="stat-card red">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <AlertTriangle />
            </div>
          </div>
          <div className="stat-card-value">{criticalCount}</div>
          <div className="stat-card-label">Criticos</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <AlertCircle />
            </div>
          </div>
          <div className="stat-card-value">{acknowledgedCount}</div>
          <div className="stat-card-label">Reconhecidos</div>
        </div>

        <div className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <CheckCircle />
            </div>
          </div>
          <div className="stat-card-value">{resolvedCount}</div>
          <div className="stat-card-label">Resolvidos (24h)</div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">
              <Settings size={20} />
              Configuracoes de Alerta
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="form-group">
                <label htmlFor="disk_warning" className="form-label">Alerta de Disco (%)</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      id="disk_warning"
                      type="number"
                      value={settings.disk_warning_percent}
                      onChange={(e) => setSettings({ ...settings, disk_warning_percent: parseInt(e.target.value) || 80 })}
                      className="input"
                      placeholder="Aviso"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aviso</p>
                  </div>
                  <div className="flex-1">
                    <input
                      id="disk_critical"
                      type="number"
                      value={settings.disk_critical_percent}
                      onChange={(e) => setSettings({ ...settings, disk_critical_percent: parseInt(e.target.value) || 95 })}
                      className="input"
                      placeholder="Critico"
                    />
                    <p className="text-xs text-gray-500 mt-1">Critico</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="offline_warning" className="form-label">Offline (minutos)</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      id="offline_warning"
                      type="number"
                      value={settings.offline_warning_minutes}
                      onChange={(e) => setSettings({ ...settings, offline_warning_minutes: parseInt(e.target.value) || 60 })}
                      className="input"
                      placeholder="Aviso"
                    />
                    <p className="text-xs text-gray-500 mt-1">Aviso</p>
                  </div>
                  <div className="flex-1">
                    <input
                      id="offline_critical"
                      type="number"
                      value={settings.offline_critical_minutes}
                      onChange={(e) => setSettings({ ...settings, offline_critical_minutes: parseInt(e.target.value) || 1440 })}
                      className="input"
                      placeholder="Critico"
                    />
                    <p className="text-xs text-gray-500 mt-1">Critico</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notificacoes</label>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                    className="checkbox"
                  />
                  <span className="text-gray-700">Receber alertas por e-mail</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Salvando...' : 'Salvar Configuracoes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Todos', count: alerts.length },
              { key: 'active', label: 'Ativos', count: activeCount },
              { key: 'acknowledged', label: 'Reconhecidos', count: acknowledgedCount },
              { key: 'resolved', label: 'Resolvidos', count: resolvedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tab.label}
                <span className={`badge ${filter === tab.key ? 'badge-light' : 'badge-gray'} ml-2`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Bell size={20} />
            Lista de Alertas
          </h2>
        </div>
        <div className="card-body">
          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <p>Nenhum alerta {filter !== 'all' ? `${filter}` : ''} no momento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => {
                const typeConfig = alertTypeConfig[alert.alert_type] || alertTypeConfig.security;
                const sevConfig = severityConfig[alert.severity];
                const TypeIcon = typeConfig.icon;
                const SevIcon = sevConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className={`alert-item severity-${alert.severity} ${alert.status === 'resolved' ? 'resolved' : ''}`}
                  >
                    <div className="alert-item-content">
                      <div className={`alert-item-icon ${alert.severity}`}>
                        <SevIcon size={20} />
                      </div>
                      <div className="alert-item-body">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{alert.title}</span>
                          <span className={`badge ${sevConfig.badge}`}>
                            {alert.severity === 'critical' ? 'Critico' : alert.severity === 'warning' ? 'Aviso' : 'Info'}
                          </span>
                          {alert.status === 'acknowledged' && (
                            <span className="badge badge-warning">Reconhecido</span>
                          )}
                          {alert.status === 'resolved' && (
                            <span className="badge badge-success">Resolvido</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <TypeIcon size={12} />
                            {typeConfig.label}
                          </span>
                          <Link
                            to={`/devices/${alert.device_id}`}
                            className="text-primary-600 hover:underline"
                          >
                            {alert.device_hostname}
                          </Link>
                          <span>{formatTimeAgo(alert.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="alert-item-actions">
                      {alert.status === 'active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Reconhecer
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveAlert(alert.id)}
                            className="btn btn-success btn-sm"
                          >
                            Resolver
                          </button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          type="button"
                          onClick={() => resolveAlert(alert.id)}
                          className="btn btn-success btn-sm"
                        >
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
