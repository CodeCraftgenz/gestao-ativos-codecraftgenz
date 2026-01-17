import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link, useNavigate } from 'react-router-dom';
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

// Mapeamento de rotas para cada relatorio
const reportRoutes: Record<string, string> = {
  uptime: '/reports/uptime',
  activity: '/reports/activity',
  usage: '/reports/usage',
  idle: '/reports/idle',
  users: '/reports/users',
  inventory: '/reports/inventory',
  growth: '/reports/growth',
};

export function Reports() {
  const { hasFeature, plan } = useSubscription();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Verifica se o usuario tem acesso a esta feature
  const hasAccess = hasFeature('reports');

  // Filtra relatorios por categoria
  const filteredReports = reportTypes.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  // Handler para visualizar relatorio
  const handleViewReport = (reportId: string) => {
    // TODO: Quando as rotas individuais forem implementadas, usar navigate
    // navigate(reportRoutes[reportId]);
    setSelectedReport(reportId);
  };

  // Handler para exportar relatorio
  const handleExportReport = async (reportId: string) => {
    setIsExporting(true);
    // TODO: Implementar exportacao real via API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert(`Exportacao do relatorio "${reportId}" sera implementada em breve!`);
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
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Periodo */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="15d">Ultimos 15 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="90d">Ultimos 90 dias</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Categoria */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <div className="flex gap-1 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => handleViewReport(report.id)}
                >
                  <FileBarChart size={14} />
                  Visualizar
                </button>
                <button
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
              Os relatorios podem ser exportados em formato CSV, Excel (XLSX) ou PDF.
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
                  <p className="text-sm text-gray-500">Periodo: {dateRange === '7d' ? 'Ultimos 7 dias' : dateRange === '15d' ? 'Ultimos 15 dias' : dateRange === '30d' ? 'Ultimos 30 dias' : dateRange === '90d' ? 'Ultimos 90 dias' : 'Personalizado'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <ReportContent reportId={selectedReport} dateRange={dateRange} />
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
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
function ReportContent({ reportId, dateRange }: { reportId: string; dateRange: string }) {
  // TODO: Buscar dados reais da API baseado no reportId e dateRange

  const renderPlaceholder = (title: string, description: string) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileBarChart size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  );

  switch (reportId) {
    case 'uptime':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumo de Uptime</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">98.5%</div>
                <div className="text-sm text-gray-500">Uptime Medio</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">42h</div>
                <div className="text-sm text-gray-500">Tempo Online Medio</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">2.3h</div>
                <div className="text-sm text-gray-500">Tempo Offline Medio</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Dados detalhados por dispositivo serao carregados da API em breve.
          </p>
        </div>
      );

    case 'activity':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Atividade no Periodo</h4>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">1,234</div>
                <div className="text-sm text-gray-500">Heartbeats</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-gray-500">Logins</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-gray-500">Eventos</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-gray-600">12</div>
                <div className="text-sm text-gray-500">Dispositivos</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Grafico de atividade sera implementado em breve.
          </p>
        </div>
      );

    case 'usage':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Uso Medio de Recursos</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">35%</div>
                <div className="text-sm text-gray-500">CPU Media</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">62%</div>
                <div className="text-sm text-gray-500">RAM Media</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">45%</div>
                <div className="text-sm text-gray-500">Disco Medio</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Dados detalhados por dispositivo serao carregados da API em breve.
          </p>
        </div>
      );

    case 'idle':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Dispositivos Ociosos</h4>
            <p className="text-sm text-gray-500 mb-4">
              Maquinas com baixa utilizacao de CPU/RAM no periodo selecionado.
            </p>
            <div className="space-y-2">
              {['PC-RECEPCAO', 'NOTEBOOK-SALA3', 'DESKTOP-ADMIN'].map((name, i) => (
                <div key={name} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="font-medium text-gray-900">{name}</span>
                  <span className="text-sm text-orange-600 font-medium">Score: {90 - i * 10}%</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Lista completa sera carregada da API em breve.
          </p>
        </div>
      );

    case 'users':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Usuarios por Dispositivo</h4>
            <p className="text-sm text-gray-500 mb-4">
              Historico de logins em cada maquina.
            </p>
            <div className="space-y-2">
              {[
                { device: 'PC-FINANCEIRO', users: 3, lastUser: 'joao.silva' },
                { device: 'NOTEBOOK-TI', users: 1, lastUser: 'admin' },
                { device: 'PC-RH', users: 2, lastUser: 'maria.santos' },
              ].map((item) => (
                <div key={item.device} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <span className="font-medium text-gray-900">{item.device}</span>
                    <span className="text-sm text-gray-500 ml-2">({item.users} usuarios)</span>
                  </div>
                  <span className="text-sm text-gray-600">Ultimo: {item.lastUser}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'inventory':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Inventario de Hardware</h4>
            <p className="text-sm text-gray-500 mb-4">
              Informacoes de hardware coletadas dos dispositivos.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Dispositivo</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">CPU</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">RAM</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Disco</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { device: 'PC-FINANCEIRO', cpu: 'Intel i5-10400', ram: '16 GB', disk: '256 GB SSD' },
                    { device: 'NOTEBOOK-TI', cpu: 'Intel i7-1165G7', ram: '32 GB', disk: '512 GB NVMe' },
                    { device: 'PC-RH', cpu: 'AMD Ryzen 5 5600G', ram: '8 GB', disk: '1 TB HDD' },
                  ].map((item) => (
                    <tr key={item.device} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{item.device}</td>
                      <td className="py-2 px-3 text-gray-600">{item.cpu}</td>
                      <td className="py-2 px-3 text-gray-600">{item.ram}</td>
                      <td className="py-2 px-3 text-gray-600">{item.disk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Dados reais serao carregados da API em breve.
          </p>
        </div>
      );

    case 'growth':
      return (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Crescimento do Patio</h4>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-500">Total Atual</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">+3</div>
                <div className="text-sm text-gray-500">Novos no Periodo</div>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">+33%</div>
                <div className="text-sm text-gray-500">Crescimento</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Grafico de evolucao sera implementado em breve.
          </p>
        </div>
      );

    default:
      return renderPlaceholder(
        'Relatorio em Desenvolvimento',
        'Este relatorio ainda esta sendo implementado. Em breve estara disponivel.'
      );
  }
}
