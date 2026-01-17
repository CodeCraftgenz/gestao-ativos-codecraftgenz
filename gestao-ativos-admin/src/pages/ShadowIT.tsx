import { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Eye, Ban, Clock, Filter } from 'lucide-react';

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
  const [alerts] = useState<ShadowITAlert[]>([
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'unauthorized':
        return 'bg-red-500/20 text-red-400';
      case 'risky':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'blocked':
        return <Ban size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-primary" />
            Seguranca & Shadow IT
          </h1>
          <p className="text-gray-400 mt-1">
            Detecte e gerencie software nao autorizado na sua organizacao
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Total Detectado</span>
            <AlertTriangle className="text-yellow-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{alerts.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-yellow-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Pendente Revisao</span>
            <Clock className="text-yellow-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-yellow-400 mt-2">{pendingCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Bloqueados</span>
            <Ban className="text-red-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">
            {alerts.filter(a => a.status === 'blocked').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg border border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Aprovados</span>
            <CheckCircle className="text-green-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-400 mt-2">
            {alerts.filter(a => a.status === 'approved').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-gray-400" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'all' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('blocked')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'blocked' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Bloqueados
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Aprovados
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Software</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Dispositivo</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Categoria</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Detectado</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert) => (
              <tr key={alert.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{alert.softwareName}</p>
                    <p className="text-gray-400 text-sm">{alert.publisher}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300">{alert.deviceName}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(alert.category)}`}>
                    {getCategoryLabel(alert.category)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-400 text-sm">
                    {new Date(alert.detectedAt).toLocaleString('pt-BR')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(alert.status)}
                    <span className="text-gray-300 text-sm capitalize">{alert.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye size={16} />
                    </button>
                    {alert.status === 'pending' && (
                      <>
                        <button
                          className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded transition-colors"
                          title="Aprovar"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
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

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">O que e Shadow IT?</h3>
        <p className="text-gray-300 text-sm">
          Shadow IT refere-se a software e servicos usados por funcionarios sem aprovacao
          do departamento de TI. O Patio de Controle detecta automaticamente software nao
          autorizado e permite que voce aprove ou bloqueie seu uso em toda a organizacao.
        </p>
      </div>
    </div>
  );
}
