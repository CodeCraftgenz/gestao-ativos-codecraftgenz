import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  Clock,
  Monitor,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  HardDrive,
  Zap,
  Lock,
  Crown,
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
  {
    id: 'software',
    name: 'Inventario de Software',
    description: 'Softwares instalados em cada dispositivo',
    icon: Monitor,
    category: 'inventario',
  },
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
  const [dateRange, setDateRange] = useState('7d');

  // Verifica se o usuario tem acesso a esta feature
  const hasAccess = hasFeature('reports');

  // Filtra relatorios por categoria
  const filteredReports = reportTypes.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

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
                <button className="btn btn-secondary btn-sm flex-1">
                  <FileBarChart size={14} />
                  Visualizar
                </button>
                <button className="btn btn-primary btn-sm flex-1">
                  <Download size={14} />
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
    </div>
  );
}
