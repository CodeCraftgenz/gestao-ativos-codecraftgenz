import { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  HardDrive,
  Zap,
  Lock,
  Crown,
  X,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

// Tipos de relatorios disponiveis
const reportTypes = [
  {
    id: 'uptime',
    name: 'Uptime dos Dispositivos',
    description: 'Tempo online/offline de cada dispositivo no periodo selecionado',
    icon: Clock,
    category: 'dispositivos',
  },
  {
    id: 'activity',
    name: 'Atividade por Periodo',
    description: 'Heartbeats, logins e eventos de atividade ao longo do tempo',
    icon: Activity,
    category: 'dispositivos',
  },
  {
    id: 'usage',
    name: 'Uso de Recursos',
    description: 'Consumo medio de CPU, RAM e disco por dispositivo',
    icon: Zap,
    category: 'desempenho',
  },
  {
    id: 'idle',
    name: 'Dispositivos Ociosos',
    description: 'Ranking de maquinas com baixa utilizacao',
    icon: TrendingDown,
    category: 'desempenho',
  },
  {
    id: 'users',
    name: 'Usuarios por Dispositivo',
    description: 'Historico de usuarios logados em cada maquina',
    icon: Users,
    category: 'usuarios',
  },
  {
    id: 'inventory',
    name: 'Inventario de Hardware',
    description: 'Lista completa de hardware de todos os dispositivos',
    icon: HardDrive,
    category: 'inventario',
  },
  // Inventario de Software REMOVIDO - LGPD compliance (nao expor apps instalados)
  {
    id: 'growth',
    name: 'Crescimento do Patio',
    description: 'Evolucao do numero de dispositivos ao longo do tempo',
    icon: TrendingUp,
    category: 'geral',
  },
];

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'dispositivos', name: 'Dispositivos' },
  { id: 'desempenho', name: 'Desempenho' },
  { id: 'usuarios', name: 'Usuarios' },
  { id: 'inventario', name: 'Inventario' },
  { id: 'geral', name: 'Geral' },
];

export function Reports() {
  const { hasFeature, plan } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState<unknown>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Verifica se o usuario tem acesso a esta feature
  const hasAccess = hasFeature('reports');

  // Filtra relatorios por categoria
  const filteredReports = reportTypes.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  // Carrega dados do relatorio quando selecionado
  useEffect(() => {
    if (selectedReport) {
      loadReportData(selectedReport);
    }
  }, [selectedReport, dateRange]);

  const loadReportData = async (reportId: string) => {
    setIsLoadingReport(true);
    try {
      const response = await api.get(`/api/admin/reports/${reportId}?range=${dateRange}`);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatorio:', error);
      setReportData(null);
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Handler para visualizar relatorio
  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
  };

  // Handler para exportar relatorio
  const handleExportReport = async (reportId: string) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/api/admin/reports/${reportId}/export?range=${dateRange}`, {
        responseType: 'blob',
      });

      // Criar blob e fazer download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportId}-report-${dateRange}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatorio:', error);
      alert('Erro ao exportar relatorio. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Busca dados do relatorio selecionado
  const selectedReportData = reportTypes.find(r => r.id === selectedReport);

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Relatorios</h1>
            <p className="page-description">Relatorios e exportacoes detalhadas</p>
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
              O sistema de relatorios avancados esta disponivel a partir do plano Profissional.
              Faca upgrade para acessar relatorios detalhados e exportacoes.
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
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Relatorios</h1>
            <p className="page-description">Gere relatorios detalhados do seu patio de maquinas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Periodo */}
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-input"
                aria-label="Selecionar periodo do relatorio"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="15d">Ultimos 15 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
              </select>
            </div>

            {/* Categoria - Pills melhorados */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Relatorios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => (
          <div key={report.id} className="card hover:shadow-lg transition-shadow">
            <div className="card-body">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <report.icon size={24} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => handleViewReport(report.id)}
                >
                  <FileBarChart size={14} />
                  Visualizar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => handleExportReport(report.id)}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Exportar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info sobre formatos de exportacao */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <FileBarChart className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Formatos de Exportacao</h4>
            <p className="text-sm text-blue-700 mt-1">
              Os relatorios sao exportados em formato CSV para facil importacao em Excel.
              Dados ficam disponiveis por {plan?.data_retention_days || 30} dias conforme seu plano.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Visualizacao do Relatorio */}
      {selectedReport && selectedReportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <selectedReportData.icon size={20} className="text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedReportData.name}</h2>
                  <p className="text-sm text-gray-500">Periodo: {dateRange === '7d' ? 'Ultimos 7 dias' : dateRange === '15d' ? 'Ultimos 15 dias' : dateRange === '30d' ? 'Ultimos 30 dias' : 'Ultimos 90 dias'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedReport(null); setReportData(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {isLoadingReport ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary-600" size={32} />
                  <span className="ml-3 text-gray-600">Carregando dados...</span>
                </div>
              ) : (
                <ReportContent reportId={selectedReport} data={reportData} />
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => { setSelectedReport(null); setReportData(null); }}
                className="btn btn-secondary"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => handleExportReport(selectedReport)}
                className="btn btn-primary"
                disabled={isExporting}
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para renderizar o conteudo de cada relatorio
function ReportContent({ reportId, data }: { reportId: string; data: unknown }) {
  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileBarChart size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sem dados</h3>
        <p className="text-gray-500 max-w-md mx-auto">Nenhum dado encontrado para o periodo selecionado.</p>
      </div>
    );
  }

  switch (reportId) {
    case 'uptime': {
      const report = data as {
        summary: { avgUptimePercent: number; avgOnlineHours: number; avgOfflineHours: number; totalDevices: number };
        devices: Array<{ id: number; hostname: string; serviceTag: string | null; uptimePercent: number; onlineHours: number; offlineHours: number; lastSeen: string | null }>;
      };
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo de Uptime</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{report.summary.avgUptimePercent}%</div>
                <div className="text-sm text-gray-500">Uptime Medio</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{report.summary.avgOnlineHours}h</div>
                <div className="text-sm text-gray-500">Tempo Online Medio</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{report.summary.avgOfflineHours}h</div>
                <div className="text-sm text-gray-500">Tempo Offline Medio</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-gray-600">{report.summary.totalDevices}</div>
                <div className="text-sm text-gray-500">Dispositivos</div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Service Tag</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Uptime</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Online</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Offline</th>
                </tr>
              </thead>
              <tbody>
                {report.devices.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{d.hostname}</td>
                    <td className="py-2 px-3 text-gray-600">{d.serviceTag || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-medium ${d.uptimePercent >= 90 ? 'text-green-600' : d.uptimePercent >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {d.uptimePercent}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">{d.onlineHours}h</td>
                    <td className="py-2 px-3 text-center text-gray-600">{d.offlineHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'activity': {
      const report = data as {
        summary: { totalHeartbeats: number; totalLogins: number; totalLogouts: number; totalBoots: number; totalShutdowns: number; activeDevices: number };
        dailyActivity: Array<{ date: string; heartbeats: number; logins: number; events: number }>;
      };
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo de Atividade</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{report.summary.totalHeartbeats.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Heartbeats</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{report.summary.totalLogins}</div>
                <div className="text-sm text-gray-500">Logins</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{report.summary.totalLogouts}</div>
                <div className="text-sm text-gray-500">Logouts</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{report.summary.totalBoots}</div>
                <div className="text-sm text-gray-500">Boots</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{report.summary.totalShutdowns}</div>
                <div className="text-sm text-gray-500">Shutdowns</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-gray-600">{report.summary.activeDevices}</div>
                <div className="text-sm text-gray-500">Dispositivos Ativos</div>
              </div>
            </div>
          </div>
          {report.dailyActivity.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Data</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Heartbeats</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Logins</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Eventos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailyActivity.map((d) => (
                    <tr key={d.date} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 px-3 text-center text-blue-600">{d.heartbeats}</td>
                      <td className="py-2 px-3 text-center text-green-600">{d.logins}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{d.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    case 'usage': {
      const report = data as {
        summary: { avgCpuPercent: number; avgRamPercent: number; avgDiskUsedPercent: number };
        devices: Array<{ id: number; hostname: string; avgCpu: number; avgRam: number; avgDisk: number }>;
      };
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Media Geral de Uso</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{report.summary.avgCpuPercent}%</div>
                <div className="text-sm text-gray-500">CPU Media</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{report.summary.avgRamPercent}%</div>
                <div className="text-sm text-gray-500">RAM Media</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{report.summary.avgDiskUsedPercent}%</div>
                <div className="text-sm text-gray-500">Disco Medio</div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">CPU</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">RAM</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Disco</th>
                </tr>
              </thead>
              <tbody>
                {report.devices.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{d.hostname}</td>
                    <td className="py-2 px-3 text-center text-blue-600">{d.avgCpu}%</td>
                    <td className="py-2 px-3 text-center text-purple-600">{d.avgRam}%</td>
                    <td className="py-2 px-3 text-center text-orange-600">{d.avgDisk}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'idle': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; serviceTag: string | null; avgCpu: number; avgRam: number; idleScore: number; lastActivity: string | null }>;
      };
      return (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">Dispositivos Ociosos</h4>
            <p className="text-sm text-yellow-700">Maquinas com menos de 20% CPU e 40% RAM no periodo.</p>
          </div>
          {report.devices.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum dispositivo ocioso encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">CPU</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">RAM</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Score Ociosidade</th>
                  </tr>
                </thead>
                <tbody>
                  {report.devices.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{d.hostname}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{d.avgCpu}%</td>
                      <td className="py-2 px-3 text-center text-gray-600">{d.avgRam}%</td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          {d.idleScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    case 'users': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; uniqueUsers: number; lastUser: string | null; lastLoginAt: string | null; users: string[] }>;
      };
      return (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Usuarios</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Ultimo Usuario</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Lista de Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {report.devices.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{d.hostname}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {d.uniqueUsers}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{d.lastUser || '-'}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{d.users.join(', ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'inventory': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; serviceTag: string | null; cpuModel: string | null; cpuCores: number | null; ramTotalGb: number | null; gpuModel: string | null; totalDiskGb: number | null; diskType: string | null; osName: string | null }>;
      };
      return (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">CPU</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Cores</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">RAM</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">GPU</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Disco</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">SO</th>
                </tr>
              </thead>
              <tbody>
                {report.devices.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium">{d.hostname}</div>
                      {d.serviceTag && <div className="text-xs text-gray-500">{d.serviceTag}</div>}
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{d.cpuModel || '-'}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{d.cpuCores || '-'}</td>
                    <td className="py-2 px-3 text-center text-gray-600">{d.ramTotalGb ? `${d.ramTotalGb} GB` : '-'}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{d.gpuModel || '-'}</td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {d.totalDiskGb ? `${d.totalDiskGb} GB` : '-'}
                      {d.diskType && <span className="text-xs text-gray-400 ml-1">({d.diskType})</span>}
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{d.osName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'growth': {
      const report = data as {
        summary: { totalDevices: number; newInPeriod: number; growthPercent: number };
        monthly: Array<{ month: string; total: number; new: number }>;
      };
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo de Crescimento</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{report.summary.totalDevices}</div>
                <div className="text-sm text-gray-500">Total Atual</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">+{report.summary.newInPeriod}</div>
                <div className="text-sm text-gray-500">Novos no Periodo</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className={`text-2xl font-bold ${report.summary.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {report.summary.growthPercent >= 0 ? '+' : ''}{report.summary.growthPercent}%
                </div>
                <div className="text-sm text-gray-500">Crescimento</div>
              </div>
            </div>
          </div>
          {report.monthly.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Mes</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Total</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Novos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.monthly.map((m) => (
                    <tr key={m.month} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{m.month}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{m.total}</td>
                      <td className="py-2 px-3 text-center text-green-600">+{m.new}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileBarChart size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Relatorio em Desenvolvimento</h3>
          <p className="text-gray-500 max-w-md mx-auto">Este relatorio ainda esta sendo implementado.</p>
        </div>
      );
  }
}
