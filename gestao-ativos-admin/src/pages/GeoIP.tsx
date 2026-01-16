import { useState, useEffect } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Globe,
  Monitor,
  Wifi,
  RefreshCw,
  Search,
  Lock,
  Crown,
  TrendingUp,
  Building2,
  MapPinned,
  AlertCircle,
} from 'lucide-react';
import { devicesService } from '../services/devices.service';
import type { Device } from '../types';

// Dados simulados de localizacao (em producao viria do GeoIP)
interface DeviceLocation {
  device_id: number;
  hostname: string;
  ip_address: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  status: string;
  last_seen_at: string | null;
}

export function GeoIP() {
  const { hasFeature, plan } = useSubscription();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');

  // Verifica se o usuario tem acesso a esta feature
  const hasAccess = hasFeature('geoip');

  useEffect(() => {
    if (hasAccess) {
      loadDevices();
    } else {
      setIsLoading(false);
    }
  }, [hasAccess]);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const response = await devicesService.getAll({ limit: 100 });
      setDevices(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simula dados de GeoIP (em producao viria do backend)
  const deviceLocations: DeviceLocation[] = devices.map((d) => ({
    device_id: d.id,
    hostname: d.hostname,
    ip_address: d.primary_mac_address || 'N/A',
    city: 'Sao Paulo', // Simulado
    region: 'SP', // Simulado
    country: 'Brasil', // Simulado
    isp: 'Provedor Internet', // Simulado
    status: d.status,
    last_seen_at: d.last_seen_at,
  }));

  // Filtra dispositivos
  const filteredDevices = deviceLocations.filter((d) => {
    const matchesSearch =
      d.hostname.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase()) ||
      d.ip_address.includes(search);
    const matchesCountry = selectedCountry === 'all' || d.country === selectedCountry;
    return matchesSearch && matchesCountry;
  });

  // Agrupa por cidade
  const cityCounts = deviceLocations.reduce((acc, d) => {
    acc[d.city] = (acc[d.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Localizacao</h1>
            <p className="page-description">Geolocalizacao dos dispositivos por IP</p>
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
              O recurso de geolocalizacao por IP esta disponivel a partir do plano Profissional.
              Veja onde seus dispositivos estao localizados geograficamente.
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

        {/* Preview do que o usuario teria acesso */}
        <div className="mt-6 opacity-50 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <Globe size={24} className="text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-sm text-gray-500">Paises</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <Building2 size={24} className="text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-sm text-gray-500">Cidades</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <Wifi size={24} className="text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-sm text-gray-500">ISPs</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <Monitor size={24} className="text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <div className="text-sm text-gray-500">Dispositivos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="page-title">Localizacao</h1>
            <p className="page-description">
              Visualize a localizacao geografica dos dispositivos
            </p>
          </div>
          <div className="page-header-actions">
            <button onClick={loadDevices} className="btn btn-secondary">
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
            <div className="flex items-center gap-3">
              <Globe size={24} className="text-blue-500" />
              <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-gray-500">Paises</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-green-500" />
              <div>
                <div className="text-2xl font-bold">{Object.keys(cityCounts).length}</div>
                <div className="text-sm text-gray-500">Cidades</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <Wifi size={24} className="text-purple-500" />
              <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-gray-500">ISPs</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <Monitor size={24} className="text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{devices.length}</div>
                <div className="text-sm text-gray-500">Dispositivos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso sobre dados simulados */}
      <div className="alert alert-warning mb-6">
        <AlertCircle className="alert-icon" />
        <div>
          <strong>Dados de demonstracao:</strong> Em ambiente de producao, os dados de
          localizacao serao obtidos atraves de consulta GeoIP baseada no IP publico de cada
          dispositivo.
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por hostname, cidade ou IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="form-select"
            >
              <option value="all">Todos os paises</option>
              <option value="Brasil">Brasil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de dispositivos */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <MapPinned size={18} className="mr-2" />
            Dispositivos por Localizacao
          </h2>
        </div>
        <div className="card-body p-0">
          {filteredDevices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum dispositivo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Dispositivo</th>
                    <th>Cidade</th>
                    <th>Estado</th>
                    <th>Pais</th>
                    <th>ISP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.device_id}>
                      <td>
                        <Link
                          to={`/devices/${device.device_id}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {device.hostname}
                        </Link>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          {device.city}
                        </div>
                      </td>
                      <td>{device.region}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-gray-400" />
                          {device.country}
                        </div>
                      </td>
                      <td className="text-gray-500">{device.isp}</td>
                      <td>
                        <span
                          className={`badge ${
                            device.status === 'online'
                              ? 'badge-success'
                              : device.status === 'offline'
                              ? 'badge-secondary'
                              : 'badge-warning'
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Info sobre integracao */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Globe className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Sobre a Geolocalizacao</h4>
            <p className="text-sm text-blue-700 mt-1">
              A localizacao e determinada pelo IP publico do dispositivo no momento da conexao.
              Mudancas de rede (Wi-Fi, VPN, etc.) podem alterar a localizacao detectada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
