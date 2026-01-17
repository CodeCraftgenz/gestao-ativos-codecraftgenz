import { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  FileBarChart,
  Download,
  Calendar,
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
  Eye,
  ChevronRight,
  BarChart3,
  PieChart,
  Server,
  Cpu,
  MemoryStick,
  HardDriveDownload,
} from 'lucide-react';
import api from '../services/api';

// Cores para cada categoria
const categoryColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  dispositivos: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-500' },
  desempenho: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-500' },
  usuarios: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-500' },
  inventario: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'text-orange-500' },
  geral: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'text-gray-500' },
};

// Tipos de relatorios disponiveis
const reportTypes = [
  {
    id: 'uptime',
    name: 'Uptime dos Dispositivos',
    description: 'Tempo online/offline de cada dispositivo no periodo',
    icon: Clock,
    category: 'dispositivos',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 'activity',
    name: 'Atividade por Periodo',
    description: 'Heartbeats, logins e eventos de atividade',
    icon: Activity,
    category: 'dispositivos',
    gradient: 'from-blue-400 to-blue-500',
  },
  {
    id: 'usage',
    name: 'Uso de Recursos',
    description: 'Consumo medio de CPU, RAM e disco',
    icon: Zap,
    category: 'desempenho',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 'idle',
    name: 'Dispositivos Ociosos',
    description: 'Ranking de maquinas com baixa utilizacao',
    icon: TrendingDown,
    category: 'desempenho',
    gradient: 'from-purple-400 to-purple-500',
  },
  {
    id: 'users',
    name: 'Usuarios por Dispositivo',
    description: 'Historico de usuarios logados em cada maquina',
    icon: Users,
    category: 'usuarios',
    gradient: 'from-green-500 to-green-600',
  },
  {
    id: 'inventory',
    name: 'Inventario de Hardware',
    description: 'Lista completa de hardware dos dispositivos',
    icon: HardDrive,
    category: 'inventario',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    id: 'growth',
    name: 'Crescimento do Patio',
    description: 'Evolucao do numero de dispositivos',
    icon: TrendingUp,
    category: 'geral',
    gradient: 'from-gray-500 to-gray-600',
  },
];

const categories = [
  { id: 'all', name: 'Todos', icon: BarChart3 },
  { id: 'dispositivos', name: 'Dispositivos', icon: Server },
  { id: 'desempenho', name: 'Desempenho', icon: PieChart },
  { id: 'usuarios', name: 'Usuarios', icon: Users },
  { id: 'inventario', name: 'Inventario', icon: HardDrive },
  { id: 'geral', name: 'Geral', icon: TrendingUp },
];

const dateRangeOptions = [
  { value: '7d', label: '7 dias', shortLabel: '7D' },
  { value: '15d', label: '15 dias', shortLabel: '15D' },
  { value: '30d', label: '30 dias', shortLabel: '30D' },
  { value: '90d', label: '90 dias', shortLabel: '90D' },
];

export function Reports() {
  const { hasFeature, plan } = useSubscription();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [reportData, setReportData] = useState<unknown>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const hasAccess = hasFeature('reports');

  const filteredReports = reportTypes.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

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

  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const handleExportReport = async (reportId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsExporting(reportId);
    try {
      const response = await api.get(`/api/admin/reports/${reportId}/export?range=${dateRange}`, {
        responseType: 'blob',
      });
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
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatorio.');
    } finally {
      setIsExporting(null);
    }
  };

  const selectedReportData = reportTypes.find(r => r.id === selectedReport);
  const currentDateRange = dateRangeOptions.find(d => d.value === dateRange);

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <Lock size={40} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Relatorios Avancados</h2>
          <p className="text-gray-600 mb-6">
            Acesse relatorios detalhados, exportacoes em CSV e analises completas do seu patio de maquinas.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm mb-6">
            <Crown size={16} />
            <span>Disponivel a partir do plano Profissional</span>
          </div>
          <div>
            <Link to="/plans" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/25">
              <TrendingUp size={18} />
              Ver Planos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
          <p className="text-gray-500 mt-1">Analise detalhada do seu patio de maquinas</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200">
          <Calendar size={18} className="text-gray-400 ml-2" />
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                dateRange === option.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const colors = categoryColors[cat.id] || categoryColors.geral;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border} border-2 shadow-sm`
                  : 'bg-white text-gray-600 border-2 border-transparent hover:bg-gray-50'
              }`}
            >
              <cat.icon size={16} className={isSelected ? colors.icon : 'text-gray-400'} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredReports.map((report) => {
          const colors = categoryColors[report.category];
          return (
            <div
              key={report.id}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 cursor-pointer"
              onClick={() => handleViewReport(report.id)}
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${report.gradient} p-5`}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <report.icon size={24} className="text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleExportReport(report.id, e)}
                    disabled={isExporting === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {isExporting === report.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    CSV
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {report.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                    {categories.find(c => c.id === report.category)?.name}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-primary-600 font-medium group-hover:gap-2 transition-all">
                    <Eye size={16} />
                    Visualizar
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileBarChart size={24} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Exportacao de Dados</h4>
            <p className="text-sm text-gray-600">
              Todos os relatorios podem ser exportados em formato CSV para analise em Excel ou outras ferramentas.
              Os dados ficam disponiveis por <strong>{plan?.data_retention_days || 30} dias</strong> conforme seu plano.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Visualizacao */}
      {selectedReport && selectedReportData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${selectedReportData.gradient} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <selectedReportData.icon size={28} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedReportData.name}</h2>
                    <p className="text-white/80 text-sm mt-0.5">
                      Periodo: Ultimos {currentDateRange?.label}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedReport(null); setReportData(null); }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {isLoadingReport ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">Carregando dados do relatorio...</p>
                </div>
              ) : (
                <ReportContent reportId={selectedReport} data={reportData} />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                Dados atualizados em tempo real
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedReport(null); setReportData(null); }}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleExportReport(selectedReport)}
                  disabled={isExporting === selectedReport}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
                >
                  {isExporting === selectedReport ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Stat Card reutilizavel
function StatCard({ value, label, color, icon: Icon }: { value: string | number; label: string; color: string; icon?: React.ElementType }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color] || colorClasses.gray}`}>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} className="opacity-60" />}
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm opacity-80">{label}</div>
        </div>
      </div>
    </div>
  );
}

// Componente de Tabela estilizada
function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((header, i) => (
              <th key={i} className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b border-gray-200">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Componente para renderizar o conteudo de cada relatorio
function ReportContent({ reportId, data }: { reportId: string; data: unknown }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <FileBarChart size={40} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem dados disponíveis</h3>
        <p className="text-gray-500 text-center max-w-md">
          Nenhum dado encontrado para o periodo selecionado. Tente selecionar um periodo diferente.
        </p>
      </div>
    );
  }

  switch (reportId) {
    case 'uptime': {
      const report = data as {
        summary: { avgUptimePercent: number; avgOnlineHours: number; avgOfflineHours: number; totalDevices: number };
        devices: Array<{ id: number; hostname: string; serviceTag: string | null; uptimePercent: number; onlineHours: number; offlineHours: number }>;
      };
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={`${report.summary.avgUptimePercent}%`} label="Uptime Medio" color="green" icon={TrendingUp} />
            <StatCard value={`${report.summary.avgOnlineHours}h`} label="Online Medio" color="blue" icon={Clock} />
            <StatCard value={`${report.summary.avgOfflineHours}h`} label="Offline Medio" color="orange" icon={TrendingDown} />
            <StatCard value={report.summary.totalDevices} label="Dispositivos" color="gray" icon={Server} />
          </div>

          {report.devices.length > 0 && (
            <DataTable headers={['Dispositivo', 'Service Tag', 'Uptime', 'Online', 'Offline']}>
              {report.devices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{d.hostname}</td>
                  <td className="py-3 px-4 text-gray-500">{d.serviceTag || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                      d.uptimePercent >= 90 ? 'bg-green-100 text-green-700' :
                      d.uptimePercent >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {d.uptimePercent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{d.onlineHours}h</td>
                  <td className="py-3 px-4 text-gray-600">{d.offlineHours}h</td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      );
    }

    case 'activity': {
      const report = data as {
        summary: { totalHeartbeats: number; totalLogins: number; totalLogouts: number; totalBoots: number; totalShutdowns: number; activeDevices: number };
        dailyActivity: Array<{ date: string; heartbeats: number; logins: number; events: number }>;
      };
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard value={report.summary.totalHeartbeats.toLocaleString()} label="Heartbeats" color="blue" />
            <StatCard value={report.summary.totalLogins} label="Logins" color="green" />
            <StatCard value={report.summary.totalLogouts} label="Logouts" color="orange" />
            <StatCard value={report.summary.totalBoots} label="Boots" color="purple" />
            <StatCard value={report.summary.totalShutdowns} label="Shutdowns" color="red" />
            <StatCard value={report.summary.activeDevices} label="Ativos" color="gray" />
          </div>

          {report.dailyActivity.length > 0 && (
            <DataTable headers={['Data', 'Heartbeats', 'Logins', 'Eventos']}>
              {report.dailyActivity.map((d) => (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </td>
                  <td className="py-3 px-4 text-blue-600 font-medium">{d.heartbeats}</td>
                  <td className="py-3 px-4 text-green-600 font-medium">{d.logins}</td>
                  <td className="py-3 px-4 text-gray-600">{d.events}</td>
                </tr>
              ))}
            </DataTable>
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
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={`${report.summary.avgCpuPercent}%`} label="CPU Media" color="blue" icon={Cpu} />
            <StatCard value={`${report.summary.avgRamPercent}%`} label="RAM Media" color="purple" icon={MemoryStick} />
            <StatCard value={`${report.summary.avgDiskUsedPercent}%`} label="Disco Medio" color="orange" icon={HardDriveDownload} />
          </div>

          {report.devices.length > 0 && (
            <DataTable headers={['Dispositivo', 'CPU', 'RAM', 'Disco']}>
              {report.devices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{d.hostname}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.avgCpu}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{d.avgCpu}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${d.avgRam}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{d.avgRam}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${d.avgDisk}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{d.avgDisk}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      );
    }

    case 'idle': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; avgCpu: number; avgRam: number; idleScore: number }>;
      };
      return (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingDown size={20} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800">Dispositivos com Baixa Utilizacao</h4>
                <p className="text-sm text-yellow-700">Maquinas com menos de 20% CPU e 40% RAM no periodo.</p>
              </div>
            </div>
          </div>

          {report.devices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum dispositivo ocioso encontrado neste periodo.
            </div>
          ) : (
            <DataTable headers={['Dispositivo', 'CPU Media', 'RAM Media', 'Score Ociosidade']}>
              {report.devices.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{d.hostname}</td>
                  <td className="py-3 px-4 text-gray-600">{d.avgCpu}%</td>
                  <td className="py-3 px-4 text-gray-600">{d.avgRam}%</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-semibold">
                      {d.idleScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      );
    }

    case 'users': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; uniqueUsers: number; lastUser: string | null; users: string[] }>;
      };
      return (
        <div className="space-y-6">
          <DataTable headers={['Dispositivo', 'Qtd Usuarios', 'Ultimo Usuario', 'Usuarios']}>
            {report.devices.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{d.hostname}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                    {d.uniqueUsers}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{d.lastUser || '-'}</td>
                <td className="py-3 px-4 text-gray-500 text-sm max-w-xs truncate">{d.users.join(', ') || '-'}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      );
    }

    case 'inventory': {
      const report = data as {
        devices: Array<{ id: number; hostname: string; serviceTag: string | null; cpuModel: string | null; cpuCores: number | null; ramTotalGb: number | null; gpuModel: string | null; totalDiskGb: number | null; diskType: string | null; osName: string | null }>;
      };
      return (
        <div className="space-y-6">
          <DataTable headers={['Dispositivo', 'CPU', 'RAM', 'GPU', 'Disco', 'SO']}>
            {report.devices.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{d.hostname}</div>
                  {d.serviceTag && <div className="text-xs text-gray-500">{d.serviceTag}</div>}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600 max-w-[150px] truncate" title={d.cpuModel || undefined}>
                    {d.cpuModel || '-'}
                  </div>
                  {d.cpuCores && <div className="text-xs text-gray-400">{d.cpuCores} cores</div>}
                </td>
                <td className="py-3 px-4">
                  {d.ramTotalGb ? (
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                      {d.ramTotalGb} GB
                    </span>
                  ) : '-'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-[120px] truncate" title={d.gpuModel || undefined}>
                  {d.gpuModel || '-'}
                </td>
                <td className="py-3 px-4">
                  {d.totalDiskGb ? (
                    <div>
                      <span className="font-medium text-gray-900">{d.totalDiskGb} GB</span>
                      {d.diskType && <span className="text-xs text-gray-400 ml-1">({d.diskType})</span>}
                    </div>
                  ) : '-'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-[150px] truncate" title={d.osName || undefined}>
                  {d.osName || '-'}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      );
    }

    case 'growth': {
      const report = data as {
        summary: { totalDevices: number; newInPeriod: number; growthPercent: number };
        monthly: Array<{ month: string; total: number; new: number }>;
      };
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={report.summary.totalDevices} label="Total Atual" color="blue" icon={Server} />
            <StatCard value={`+${report.summary.newInPeriod}`} label="Novos no Periodo" color="green" icon={TrendingUp} />
            <StatCard
              value={`${report.summary.growthPercent >= 0 ? '+' : ''}${report.summary.growthPercent}%`}
              label="Crescimento"
              color={report.summary.growthPercent >= 0 ? 'green' : 'red'}
              icon={report.summary.growthPercent >= 0 ? TrendingUp : TrendingDown}
            />
          </div>

          {report.monthly.length > 0 && (
            <DataTable headers={['Mes', 'Total Acumulado', 'Novos']}>
              {report.monthly.map((m) => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{m.month}</td>
                  <td className="py-3 px-4 text-gray-600">{m.total}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-lg font-medium">
                      +{m.new}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      );
    }

    default:
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <FileBarChart size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatorio em Desenvolvimento</h3>
          <p className="text-gray-500">Este relatorio estara disponível em breve.</p>
        </div>
      );
  }
}
