import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Wifi, WifiOff, Clock, Ban, ArrowRight, Activity, Shield } from 'lucide-react';
import type { DashboardStats } from '../types';
import { devicesService } from '../services/devices.service';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await devicesService.getStats();
      setStats(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas');
      setStats({
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        pendingDevices: 0,
        blockedDevices: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Visão geral do sistema de gestão de ativos</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-6">
          <Activity className="alert-icon" />
          <span>{error} - Exibindo dados de exemplo</span>
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
          <div className="stat-card-value">{stats?.totalDevices || 0}</div>
          <div className="stat-card-label">Total de Dispositivos</div>
        </Link>

        <Link to="/devices?status=online" className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Wifi />
            </div>
          </div>
          <div className="stat-card-value">{stats?.onlineDevices || 0}</div>
          <div className="stat-card-label">Online</div>
        </Link>

        <Link to="/devices?status=offline" className="stat-card gray">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <WifiOff />
            </div>
          </div>
          <div className="stat-card-value">{stats?.offlineDevices || 0}</div>
          <div className="stat-card-label">Offline</div>
        </Link>

        <Link to="/pending" className="stat-card yellow">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Clock />
            </div>
          </div>
          <div className="stat-card-value">{stats?.pendingDevices || 0}</div>
          <div className="stat-card-label">Pendentes</div>
        </Link>

        <Link to="/devices?status=blocked" className="stat-card red">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Ban />
            </div>
          </div>
          <div className="stat-card-value">{stats?.blockedDevices || 0}</div>
          <div className="stat-card-label">Bloqueados</div>
        </Link>
      </div>

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Ações Rápidas</h2>
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
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Status do Sistema</h2>
            <Shield size={20} className="text-gray-400" />
          </div>
          <div className="card-body">
            <div className="status-row">
              <span className="status-label">Servidor API</span>
              <span className="badge badge-success">
                <span className="badge-dot"></span>
                Online
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Banco de Dados</span>
              <span className="badge badge-success">
                <span className="badge-dot"></span>
                Conectado
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Agentes Ativos</span>
              <span className="status-value">{stats?.onlineDevices || 0}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Última Atualização</span>
              <span className="status-value">{new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
