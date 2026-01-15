import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Wifi,
  WifiOff,
  Clock,
  Ban,
  ArrowRight,
  Activity,
  Shield,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
  HardDrive,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import type { DashboardAnalytics } from '../types';
import { devicesService } from '../services/devices.service';

const REFRESH_INTERVAL = 30000; // 30 segundos

const HEALTH_COLORS = {
  online: '#22c55e',
  offline: '#6b7280',
  alert: '#ef4444',
};

export function Dashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      const data = await devicesService.getAnalytics();
      setAnalytics(data);
      setLastUpdate(new Date());
      setError('');
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      loadAnalytics(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loadAnalytics]);

  const handleManualRefresh = () => {
    loadAnalytics(true);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const { stats, hourly_activity, health_summary, usage_metrics, recent_activity, plan_usage } =
    analytics || {
      stats: { totalDevices: 0, onlineDevices: 0, offlineDevices: 0, pendingDevices: 0, blockedDevices: 0 },
      hourly_activity: [],
      health_summary: { online: 0, offline: 0, alert: 0 },
      usage_metrics: [],
      recent_activity: [],
      plan_usage: { current_devices: 0, max_devices: 5, usage_percent: 0, plan_name: 'Gratuito', retention_days: 30, near_limit: false },
    };

  // Prepara dados do grafico de pizza
  const healthPieData = [
    { name: 'Online', value: health_summary.online, color: HEALTH_COLORS.online },
    { name: 'Offline', value: health_summary.offline, color: HEALTH_COLORS.offline },
    { name: 'Em Alerta', value: health_summary.alert, color: HEALTH_COLORS.alert },
  ].filter(d => d.value > 0);

  // Formata labels dos horarios
  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}h`;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Patio de Controle</h1>
            <p className="page-description">Monitoramento e telemetria de maquinas</p>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="btn btn-secondary"
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <span className="text-sm text-gray-500">
              Ultima atualizacao: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Aviso de limite do plano */}
      {plan_usage.near_limit && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="alert-icon" />
          <div>
            <strong>Limite de dispositivos proximo!</strong>
            <span className="ml-2">
              Voce esta usando {plan_usage.current_devices} de {plan_usage.max_devices} dispositivos
              do plano {plan_usage.plan_name}.
            </span>
            <Link to="/plans" className="ml-2 underline">
              Fazer upgrade
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mb-6">
          <Activity className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid mb-6">
        <Link to="/devices" className="stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Monitor />
            </div>
          </div>
          <div className="stat-card-value">{stats.totalDevices}</div>
          <div className="stat-card-label">Total de Dispositivos</div>
        </Link>

        <Link to="/devices?status=online" className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Wifi />
            </div>
          </div>
          <div className="stat-card-value">{stats.onlineDevices}</div>
          <div className="stat-card-label">Online</div>
        </Link>

        <Link to="/devices?status=offline" className="stat-card gray">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <WifiOff />
            </div>
          </div>
          <div className="stat-card-value">{stats.offlineDevices}</div>
          <div className="stat-card-label">Offline</div>
        </Link>

        <Link to="/pending" className="stat-card yellow">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Clock />
            </div>
          </div>
          <div className="stat-card-value">{stats.pendingDevices}</div>
          <div className="stat-card-label">Pendentes</div>
        </Link>

        <Link to="/devices?status=blocked" className="stat-card red">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Ban />
            </div>
          </div>
          <div className="stat-card-value">{stats.blockedDevices}</div>
          <div className="stat-card-label">Bloqueados</div>
        </Link>
      </div>

      {/* Graficos Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Atividade por Hora (Linha) */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">
              <TrendingUp size={18} className="mr-2" />
              Atividade nas Ultimas 24h
            </h2>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {hourly_activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourly_activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={formatHour}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    labelFormatter={(h) => `${formatHour(h as number)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="heartbeats"
                    name="Heartbeats"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="active_devices"
                    name="Dispositivos Ativos"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sem dados de atividade nas ultimas 24h
              </div>
            )}
          </div>
        </div>

        {/* Saude dos Dispositivos (Pizza) */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Shield size={18} className="mr-2" />
              Saude dos Dispositivos
            </h2>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {healthPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {healthPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Nenhum dispositivo registrado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graficos Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Metricas de Uso/Ociosidade */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Zap size={18} className="mr-2" />
              Dispositivos por Ociosidade
            </h2>
            <span className="text-sm text-gray-500">Score maior = mais ocioso</span>
          </div>
          <div className="card-body" style={{ height: 280 }}>
            {usage_metrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage_metrics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} stroke="#6b7280" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="hostname"
                    width={100}
                    stroke="#6b7280"
                    fontSize={11}
                    tickFormatter={(v) => v.length > 12 ? `${v.substring(0, 12)}...` : v}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => {
                      const v = value as number;
                      if (name === 'idle_score') return [`${v}%`, 'Score Ociosidade'];
                      if (name === 'avg_cpu_percent') return [`${v.toFixed(1)}%`, 'CPU Media'];
                      if (name === 'avg_ram_percent') return [`${v.toFixed(1)}%`, 'RAM Media'];
                      return [v, name];
                    }}
                  />
                  <Bar dataKey="idle_score" name="idle_score" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Sem metricas de uso disponiveis
              </div>
            )}
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Activity size={18} className="mr-2" />
              Atividade Recente
            </h2>
          </div>
          <div className="card-body">
            {recent_activity.length > 0 ? (
              <div className="space-y-3" style={{ maxHeight: 260, overflowY: 'auto' }}>
                {recent_activity.map((activity) => (
                  <div key={activity.device_id} className="activity-item">
                    <div className="activity-item-icon">
                      <Monitor size={16} />
                    </div>
                    <div className="activity-item-content">
                      <div className="activity-item-title">
                        <Link to={`/devices/${activity.device_id}`} className="hover:underline">
                          {activity.hostname}
                        </Link>
                      </div>
                      <div className="activity-item-meta">
                        {activity.assigned_user && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {activity.assigned_user}
                          </span>
                        )}
                        {activity.ip_address && (
                          <span className="flex items-center gap-1">
                            <HardDrive size={12} />
                            {activity.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="activity-item-time">
                      {activity.last_seen_at
                        ? new Date(activity.last_seen_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </div>
                    <span
                      className={`badge ${
                        activity.status === 'online'
                          ? 'badge-success'
                          : activity.status === 'offline'
                          ? 'badge-secondary'
                          : 'badge-warning'
                      }`}
                    >
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400">
                Nenhuma atividade recente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & Plan Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Acoes Rapidas</h2>
          </div>
          <div className="card-body">
            <div className="flex flex-col gap-3">
              <Link to="/pending" className="quick-action">
                <div className="quick-action-content">
                  <div className="quick-action-icon yellow">
                    <Clock size={20} />
                  </div>
                  <span className="quick-action-text">Aprovar dispositivos pendentes</span>
                </div>
                <ArrowRight size={20} className="quick-action-arrow" />
              </Link>

              <Link to="/devices" className="quick-action">
                <div className="quick-action-content">
                  <div className="quick-action-icon blue">
                    <Monitor size={20} />
                  </div>
                  <span className="quick-action-text">Gerenciar dispositivos</span>
                </div>
                <ArrowRight size={20} className="quick-action-arrow" />
              </Link>

              <Link to="/plans" className="quick-action">
                <div className="quick-action-content">
                  <div className="quick-action-icon green">
                    <TrendingUp size={20} />
                  </div>
                  <span className="quick-action-text">Ver planos disponiveis</span>
                </div>
                <ArrowRight size={20} className="quick-action-arrow" />
              </Link>
            </div>
          </div>
        </div>

        {/* Plan Usage Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Uso do Plano</h2>
            <span className="badge badge-primary">{plan_usage.plan_name}</span>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Dispositivos</span>
                <span className="text-sm font-medium">
                  {plan_usage.current_devices} / {plan_usage.max_devices}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${
                    plan_usage.usage_percent >= 80
                      ? 'bg-danger'
                      : plan_usage.usage_percent >= 60
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                  style={{ width: `${Math.min(100, plan_usage.usage_percent)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="status-row">
                <span className="status-label">Retencao de dados</span>
                <span className="status-value">{plan_usage.retention_days} dias</span>
              </div>
              <div className="status-row">
                <span className="status-label">Uso atual</span>
                <span className="status-value">{plan_usage.usage_percent}%</span>
              </div>
            </div>

            {plan_usage.near_limit && (
              <div className="mt-4">
                <Link to="/plans" className="btn btn-primary w-full">
                  <TrendingUp size={16} />
                  Fazer Upgrade
                </Link>
              </div>
            )}

            {/* LGPD Notice */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">
                <Shield size={12} className="inline mr-1" />
                <strong>LGPD:</strong> Os dados de telemetria sao armazenados por{' '}
                {plan_usage.retention_days} dias conforme seu plano. Apos este periodo, sao
                automaticamente anonimizados ou excluidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
