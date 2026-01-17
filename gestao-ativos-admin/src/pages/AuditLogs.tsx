import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Filter,
  Search,
  User,
  Monitor,
  Settings,
  AlertTriangle,
  Lock,
  Crown,
  TrendingUp,
  Shield,
  Clock,
  Activity,
  Eye,
  Calendar,
} from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  category: 'user' | 'device' | 'system' | 'security';
  actor: string;
  target?: string;
  details: string;
  ipAddress: string;
}

export default function AuditLogs() {
  const { hasFeature, plan } = useSubscription();
  const [logs] = useState<AuditLog[]>([
    {
      id: 1,
      timestamp: '2025-01-17T10:45:00',
      action: 'LOGIN',
      category: 'user',
      actor: 'admin@empresa.com',
      details: 'Login bem-sucedido',
      ipAddress: '192.168.1.100',
    },
    {
      id: 2,
      timestamp: '2025-01-17T10:30:00',
      action: 'DEVICE_REGISTERED',
      category: 'device',
      actor: 'admin@empresa.com',
      target: 'DESKTOP-ABC123',
      details: 'Novo dispositivo registrado',
      ipAddress: '192.168.1.100',
    },
    {
      id: 3,
      timestamp: '2025-01-17T10:15:00',
      action: 'SETTINGS_CHANGED',
      category: 'system',
      actor: 'admin@empresa.com',
      details: 'Configuracao de alertas atualizada',
      ipAddress: '192.168.1.100',
    },
    {
      id: 4,
      timestamp: '2025-01-17T09:45:00',
      action: 'SHADOW_IT_BLOCKED',
      category: 'security',
      actor: 'Sistema',
      target: 'TeamViewer',
      details: 'Software bloqueado por politica',
      ipAddress: 'N/A',
    },
    {
      id: 5,
      timestamp: '2025-01-17T09:30:00',
      action: 'API_TOKEN_CREATED',
      category: 'security',
      actor: 'admin@empresa.com',
      details: 'Novo token de API criado',
      ipAddress: '192.168.1.100',
    },
    {
      id: 6,
      timestamp: '2025-01-17T09:00:00',
      action: 'USER_CREATED',
      category: 'user',
      actor: 'admin@empresa.com',
      target: 'usuario@empresa.com',
      details: 'Novo usuario criado',
      ipAddress: '192.168.1.100',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const hasAccess = hasFeature('auditLogs');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <User size={16} className="text-blue-500" />;
      case 'device':
        return <Monitor size={16} className="text-green-500" />;
      case 'system':
        return <Settings size={16} className="text-purple-500" />;
      case 'security':
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'user':
        return 'Usuario';
      case 'device':
        return 'Dispositivo';
      case 'system':
        return 'Sistema';
      case 'security':
        return 'Seguranca';
      default:
        return category;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'user':
        return 'badge badge-info';
      case 'device':
        return 'badge badge-success';
      case 'system':
        return 'badge badge-secondary';
      case 'security':
        return 'badge badge-danger';
      default:
        return 'badge badge-secondary';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleExport = (format: 'csv' | 'json') => {
    alert(`Exportando logs em formato ${format.toUpperCase()}...`);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Auditoria & Logs</h1>
            <p className="page-description">Registros completos de todas as acoes do sistema</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Recurso Bloqueado
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Logs de auditoria estao disponiveis a partir do plano Profissional.
              Mantenha um registro completo de todas as acoes para compliance e seguranca.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Crown size={16} className="text-yellow-500" />
              <span>Seu plano atual: <strong>{plan?.name || 'Gratuito'}</strong></span>
            </div>
            <Link to="/plans" className="btn btn-primary">
              <TrendingUp size={16} />
              Ver Planos
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 opacity-50 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <Shield size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Compliance</h3>
                <p className="text-sm text-gray-500">Atenda requisitos de auditoria</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Clock size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Historico Completo</h3>
                <p className="text-sm text-gray-500">Todas as acoes registradas</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Download size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Exportacao</h3>
                <p className="text-sm text-gray-500">CSV, JSON e mais</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estatisticas
  const stats = {
    total: logs.length,
    today: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
    security: logs.filter(l => l.category === 'security').length,
    users: new Set(logs.map(l => l.actor)).size,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Auditoria & Logs</h1>
            <p className="page-description">
              Visualize e exporte logs de auditoria do sistema
            </p>
          </div>
          <div className="page-header-actions">
            <button type="button" onClick={() => handleExport('csv')} className="btn btn-secondary">
              <Download size={16} />
              Exportar CSV
            </button>
            <button type="button" onClick={() => handleExport('json')} className="btn btn-primary">
              <Download size={16} />
              Exportar JSON
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Registros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="text-primary" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Registros Hoje</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Calendar className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Eventos Seguranca</p>
                <p className="text-2xl font-bold text-red-600">{stats.security}</p>
              </div>
              <AlertTriangle className="text-red-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.users}</p>
              </div>
              <Activity className="text-green-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input"
                aria-label="Filtrar por categoria"
              >
                <option value="all">Todas categorias</option>
                <option value="user">Usuario</option>
                <option value="device">Dispositivo</option>
                <option value="system">Sistema</option>
                <option value="security">Seguranca</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Registros de Auditoria</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Categoria</th>
                  <th>Acao</th>
                  <th>Ator</th>
                  <th>Alvo</th>
                  <th>IP</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td>
                      <span className={getCategoryBadge(log.category)}>
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(log.category)}
                          {getCategoryLabel(log.category)}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900">{log.action}</span>
                    </td>
                    <td>
                      <span className="text-gray-600">{log.actor}</span>
                    </td>
                    <td>
                      <span className="text-gray-500">{log.target || '-'}</span>
                    </td>
                    <td>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{log.ipAddress}</code>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleViewDetails(log)}
                        className="btn btn-ghost btn-sm"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-500 text-sm">
          Mostrando {filteredLogs.length} de {logs.length} registros
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-secondary btn-sm" disabled>
            Anterior
          </button>
          <span className="px-3 py-1 bg-primary text-white rounded text-sm">1</span>
          <button type="button" className="btn btn-secondary btn-sm" disabled>
            Proximo
          </button>
        </div>
      </div>

      {/* Retention Info */}
      <div className="alert alert-warning">
        <Clock className="alert-icon" />
        <div>
          <h4 className="font-semibold">Retencao de Logs</h4>
          <p className="text-sm mt-1">
            De acordo com as configuracoes LGPD do seu plano, os logs de auditoria sao mantidos
            por <strong>365 dias</strong>. Apos esse periodo, os logs sao
            automaticamente anonimizados e agregados para fins estatisticos.
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalhes do Registro</h3>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="btn btn-ghost btn-sm"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID</label>
                    <p className="text-gray-900">#{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                    <p className="text-gray-900">
                      {new Date(selectedLog.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Categoria</label>
                    <p className="flex items-center gap-2 mt-1">
                      <span className={getCategoryBadge(selectedLog.category)}>
                        {getCategoryLabel(selectedLog.category)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Acao</label>
                    <p className="text-gray-900 font-medium">{selectedLog.action}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ator</label>
                  <p className="text-gray-900">{selectedLog.actor}</p>
                </div>
                {selectedLog.target && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alvo</label>
                    <p className="text-gray-900">{selectedLog.target}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Detalhes</label>
                  <p className="text-gray-900">{selectedLog.details}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Endereco IP</label>
                  <p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedLog.ipAddress}</code>
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
