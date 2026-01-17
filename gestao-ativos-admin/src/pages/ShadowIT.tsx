import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Eye,
  Ban,
  Clock,
  Filter,
  Lock,
  Crown,
  TrendingUp,
  Shield,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';

interface ShadowITAlert {
  id: number;
  deviceName: string;
  softwareName: string;
  publisher: string;
  category: 'unauthorized' | 'risky' | 'unknown';
  detectedAt: string;
  status: 'pending' | 'approved' | 'blocked';
}

export default function ShadowIT() {
  const { hasFeature, plan } = useSubscription();
  const [alerts, setAlerts] = useState<ShadowITAlert[]>([
    {
      id: 1,
      deviceName: 'DESKTOP-ABC123',
      softwareName: 'TeamViewer',
      publisher: 'TeamViewer GmbH',
      category: 'risky',
      detectedAt: '2025-01-17T09:15:00',
      status: 'pending',
    },
    {
      id: 2,
      deviceName: 'LAPTOP-XYZ789',
      softwareName: 'AnyDesk',
      publisher: 'AnyDesk Software GmbH',
      category: 'unauthorized',
      detectedAt: '2025-01-17T08:30:00',
      status: 'blocked',
    },
    {
      id: 3,
      deviceName: 'DESKTOP-DEF456',
      softwareName: 'Slack',
      publisher: 'Slack Technologies',
      category: 'unknown',
      detectedAt: '2025-01-16T14:20:00',
      status: 'approved',
    },
    {
      id: 4,
      deviceName: 'NOTEBOOK-GHI321',
      softwareName: 'Dropbox',
      publisher: 'Dropbox Inc.',
      category: 'risky',
      detectedAt: '2025-01-16T11:45:00',
      status: 'pending',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'blocked' | 'approved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ShadowITAlert | null>(null);

  const hasAccess = hasFeature('shadowItAlert');

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'unauthorized':
        return 'badge-danger';
      case 'risky':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'unauthorized':
        return 'Nao Autorizado';
      case 'risky':
        return 'Risco';
      default:
        return 'Desconhecido';
    }
  };

  const handleApprove = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'approved' as const } : a));
  };

  const handleBlock = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'blocked' as const } : a));
  };

  const handleViewDetails = (alert: ShadowITAlert) => {
    setSelectedAlert(alert);
    setShowDetailModal(true);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.status === filter;
    const matchesSearch = alert.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.publisher.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const blockedCount = alerts.filter(a => a.status === 'blocked').length;
  const approvedCount = alerts.filter(a => a.status === 'approved').length;

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Seguranca & Shadow IT</h1>
            <p className="page-description">Detecte software nao autorizado</p>
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
              Deteccao de Shadow IT esta disponivel a partir do plano Profissional.
              Identifique software nao autorizado em sua organizacao.
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
                <ShieldAlert size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Deteccao Automatica</h3>
                <p className="text-sm text-gray-500">Identifica software nao autorizado</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Ban size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Bloqueio Remoto</h3>
                <p className="text-sm text-gray-500">Bloqueie software em toda a rede</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Shield size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Politicas de Seguranca</h3>
                <p className="text-sm text-gray-500">Defina regras customizadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Seguranca & Shadow IT</h1>
            <p className="page-description">
              Detecte e gerencie software nao autorizado na sua organizacao
            </p>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn btn-secondary">
              <RefreshCw size={16} />
              Atualizar
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
                <p className="text-sm text-gray-500">Total Detectado</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <AlertTriangle className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendente Revisao</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">{blockedCount}</p>
              </div>
              <Ban className="text-red-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar software, dispositivo ou publicador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`btn btn-sm ${filter === 'pending' ? 'btn-warning' : 'btn-secondary'}`}
              >
                Pendentes
              </button>
              <button
                type="button"
                onClick={() => setFilter('blocked')}
                className={`btn btn-sm ${filter === 'blocked' ? 'btn-danger' : 'btn-secondary'}`}
              >
                Bloqueados
              </button>
              <button
                type="button"
                onClick={() => setFilter('approved')}
                className={`btn btn-sm ${filter === 'approved' ? 'btn-success' : 'btn-secondary'}`}
              >
                Aprovados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Software Detectado</h2>
        </div>
        <div className="card-body p-0">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum software encontrado com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Software</th>
                    <th>Dispositivo</th>
                    <th>Categoria</th>
                    <th>Detectado</th>
                    <th>Status</th>
                    <th style={{ width: 150 }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <div className="font-medium text-gray-900">{alert.softwareName}</div>
                        <div className="text-xs text-gray-500">{alert.publisher}</div>
                      </td>
                      <td>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {alert.deviceName}
                        </code>
                      </td>
                      <td>
                        <span className={`badge ${getCategoryBadge(alert.category)}`}>
                          {getCategoryLabel(alert.category)}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm">{new Date(alert.detectedAt).toLocaleDateString('pt-BR')}</div>
                        <div className="text-xs text-gray-500">{new Date(alert.detectedAt).toLocaleTimeString('pt-BR')}</div>
                      </td>
                      <td>
                        {alert.status === 'pending' && (
                          <span className="badge badge-warning">Pendente</span>
                        )}
                        {alert.status === 'approved' && (
                          <span className="badge badge-success">Aprovado</span>
                        )}
                        {alert.status === 'blocked' && (
                          <span className="badge badge-danger">Bloqueado</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(alert)}
                            className="btn btn-sm btn-ghost"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          {alert.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(alert.id)}
                                className="btn btn-sm btn-ghost text-green-600"
                                title="Aprovar"
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBlock(alert.id)}
                                className="btn btn-sm btn-ghost text-red-600"
                                title="Bloquear"
                              >
                                <Ban size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">O que e Shadow IT?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Shadow IT refere-se a software e servicos usados por funcionarios sem aprovacao
              do departamento de TI. O Patio de Controle detecta automaticamente software nao
              autorizado e permite que voce aprove ou bloqueie seu uso em toda a organizacao.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalhes do Software</h3>
              <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-ghost btn-sm" title="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Software</span>
                  <span className="font-medium">{selectedAlert.softwareName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Publicador</span>
                  <span className="font-medium">{selectedAlert.publisher}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Dispositivo</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedAlert.deviceName}</code>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Categoria</span>
                  <span className={`badge ${getCategoryBadge(selectedAlert.category)}`}>
                    {getCategoryLabel(selectedAlert.category)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Detectado em</span>
                  <span>{new Date(selectedAlert.detectedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Status</span>
                  {selectedAlert.status === 'pending' && <span className="badge badge-warning">Pendente</span>}
                  {selectedAlert.status === 'approved' && <span className="badge badge-success">Aprovado</span>}
                  {selectedAlert.status === 'blocked' && <span className="badge badge-danger">Bloqueado</span>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedAlert.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => { handleBlock(selectedAlert.id); setShowDetailModal(false); }}
                    className="btn btn-danger"
                  >
                    <Ban size={16} />
                    Bloquear
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleApprove(selectedAlert.id); setShowDetailModal(false); }}
                    className="btn btn-success"
                  >
                    <CheckCircle size={16} />
                    Aprovar
                  </button>
                </>
              )}
              {selectedAlert.status !== 'pending' && (
                <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary">
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
