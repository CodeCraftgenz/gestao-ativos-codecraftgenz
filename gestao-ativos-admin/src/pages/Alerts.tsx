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
  Check,
  Bell,
  Settings,
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

const severityConfig: Record<string, { color: string; bgColor: string; icon: React.ElementType }> = {
  info: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Info },
  warning: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-yellow-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Central de Alertas</h1>
            <p className="text-gray-600">Monitore problemas e tome acoes preventivas</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Settings className="w-4 h-4" />
          Configurar Alertas
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Alertas Ativos</div>
          <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Criticos</div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Reconhecidos</div>
          <div className="text-2xl font-bold text-yellow-600">
            {alerts.filter(a => a.status === 'acknowledged').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Resolvidos (24h)</div>
          <div className="text-2xl font-bold text-green-600">
            {alerts.filter(a => a.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuracoes de Alerta</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alerta de disco (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.disk_warning_percent}
                  onChange={(e) => setSettings({ ...settings, disk_warning_percent: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Warning"
                />
                <input
                  type="number"
                  value={settings.disk_critical_percent}
                  onChange={(e) => setSettings({ ...settings, disk_critical_percent: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Critical"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offline (minutos)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.offline_warning_minutes}
                  onChange={(e) => setSettings({ ...settings, offline_warning_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Warning"
                />
                <input
                  type="number"
                  value={settings.offline_critical_minutes}
                  onChange={(e) => setSettings({ ...settings, offline_critical_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Critical"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notificacoes por e-mail
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-700">Receber alertas por e-mail</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Salvar Configuracoes
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'active', label: 'Ativos' },
          { key: 'acknowledged', label: 'Reconhecidos' },
          { key: 'resolved', label: 'Resolvidos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Check className="w-12 h-12 mx-auto text-green-500 mb-2" />
            <p className="text-gray-600">Nenhum alerta {filter !== 'all' ? `${filter}` : ''} no momento</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const typeConfig = alertTypeConfig[alert.alert_type] || alertTypeConfig.security;
            const sevConfig = severityConfig[alert.severity];
            const TypeIcon = typeConfig.icon;
            const SevIcon = sevConfig.icon;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  alert.status === 'resolved' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-stretch">
                  {/* Severity Indicator */}
                  <div className={`w-2 ${sevConfig.bgColor}`} />

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full ${sevConfig.bgColor} flex items-center justify-center`}>
                          <SevIcon className={`w-5 h-5 ${sevConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${sevConfig.bgColor} ${sevConfig.color}`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig.label}
                            </span>
                            <Link
                              to={`/devices/${alert.device_id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {alert.device_hostname}
                            </Link>
                            <span>{formatTimeAgo(alert.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="px-3 py-1.5 text-sm text-yellow-600 border border-yellow-600 rounded hover:bg-yellow-50"
                              title="Reconhecer alerta"
                            >
                              Reconhecer
                            </button>
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                              title="Marcar como resolvido"
                            >
                              Resolver
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="px-3 py-1.5 text-sm text-green-600 border border-green-600 rounded hover:bg-green-50"
                          >
                            Resolver
                          </button>
                        )}
                        {alert.status === 'resolved' && (
                          <span className="px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded">
                            Resolvido
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
