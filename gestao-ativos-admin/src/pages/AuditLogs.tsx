import { useState } from 'react';
import { FileText, Download, Filter, Search, User, Monitor, Settings, AlertTriangle } from 'lucide-react';

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <User size={16} className="text-blue-400" />;
      case 'device':
        return <Monitor size={16} className="text-green-400" />;
      case 'system':
        return <Settings size={16} className="text-purple-400" />;
      case 'security':
        return <AlertTriangle size={16} className="text-red-400" />;
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
    // Placeholder for export functionality
    alert(`Exportando logs em formato ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-primary" />
            Auditoria & Logs
          </h1>
          <p className="text-gray-400 mt-1">
            Visualize e exporte logs de auditoria do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} />
            Exportar CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={18} />
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todas categorias</option>
            <option value="user">Usuario</option>
            <option value="device">Dispositivo</option>
            <option value="system">Sistema</option>
            <option value="security">Seguranca</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Data/Hora</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Categoria</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Acao</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Ator</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Alvo</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Detalhes</th>
              <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(log.category)}
                    <span className="text-gray-300 text-sm">{getCategoryLabel(log.category)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white font-medium text-sm">{log.action}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-300 text-sm">{log.actor}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-400 text-sm">{log.target || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-400 text-sm">{log.details}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-500 text-sm font-mono">{log.ipAddress}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">
          Mostrando {filteredLogs.length} de {logs.length} registros
        </span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50" disabled>
            Anterior
          </button>
          <span className="px-3 py-1 bg-primary text-white rounded">1</span>
          <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50" disabled>
            Proximo
          </button>
        </div>
      </div>

      {/* Retention Info */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h3 className="text-yellow-400 font-semibold mb-2">Retencao de Logs</h3>
        <p className="text-gray-300 text-sm">
          De acordo com as configuracoes LGPD do seu plano, os logs de auditoria sao mantidos
          por <strong className="text-white">365 dias</strong>. Apos esse periodo, os logs sao
          automaticamente anonimizados e agregados para fins estatisticos.
        </p>
      </div>
    </div>
  );
}
