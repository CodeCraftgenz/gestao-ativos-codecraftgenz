import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Code,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Crown,
  TrendingUp,
  Book,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Shield,
  Zap,
} from 'lucide-react';

// Endpoints da API disponiveis
const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/admin/devices',
    description: 'Lista todos os dispositivos com paginacao',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/admin/devices/:id',
    description: 'Obtem detalhes de um dispositivo especifico',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/admin/devices/pending',
    description: 'Lista dispositivos pendentes de aprovacao',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/admin/devices/:id/approve',
    description: 'Aprova um dispositivo pendente',
    auth: true,
  },
  {
    method: 'POST',
    path: '/api/admin/devices/:id/block',
    description: 'Bloqueia um dispositivo',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/admin/dashboard/analytics',
    description: 'Obtem metricas e analytics do dashboard',
    auth: true,
  },
  {
    method: 'GET',
    path: '/api/admin/subscription',
    description: 'Obtem dados da subscription atual',
    auth: true,
  },
];

export function ApiAccess() {
  const { hasFeature, plan } = useSubscription();
  const { user } = useAuth();
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Token de API simulado (em producao seria gerado pelo backend)
  const apiToken = 'patio_api_' + btoa(`${user?.id || 0}:${Date.now()}`).slice(0, 32);

  // Verifica se o usuario tem acesso a esta feature
  const hasAccess = hasFeature('apiAccess');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">API</h1>
            <p className="page-description">Acesso programatico ao sistema</p>
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
              O acesso a API esta disponivel apenas no plano Empresarial.
              Integre o Patio de Controle com seus sistemas atraves da API REST.
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <Terminal size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">API REST</h3>
                <p className="text-sm text-gray-500">Endpoints documentados</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Zap size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Webhooks</h3>
                <p className="text-sm text-gray-500">Notificacoes em tempo real</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Shield size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Tokens Seguros</h3>
                <p className="text-sm text-gray-500">Autenticacao JWT</p>
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
            <h1 className="page-title">API</h1>
            <p className="page-description">
              Integre o Patio de Controle com seus sistemas
            </p>
          </div>
          <div className="page-header-actions">
            <a
              href="#endpoints"
              className="btn btn-secondary"
            >
              <Book size={16} />
              Documentacao
            </a>
          </div>
        </div>
      </div>

      {/* Token de API */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">
            <Key size={18} className="mr-2" />
            Token de Acesso
          </h2>
        </div>
        <div className="card-body">
          <div className="alert alert-warning mb-4">
            <AlertTriangle className="alert-icon" />
            <div>
              <strong>Mantenha seu token seguro!</strong>
              <span className="ml-1">
                Nunca compartilhe seu token de API. Ele da acesso total a sua conta.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                readOnly
                className="form-input font-mono text-sm pr-20"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={() => copyToClipboard(apiToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
              </button>
            </div>
            <button className="btn btn-secondary">
              <RefreshCw size={16} />
              Regenerar
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Use este token no header <code className="bg-gray-100 px-1 rounded">Authorization: Bearer {'<token>'}</code>
          </p>
        </div>
      </div>

      {/* Exemplo de uso */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">
            <Terminal size={18} className="mr-2" />
            Exemplo de Uso
          </h2>
        </div>
        <div className="card-body">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{`# Listar dispositivos
curl -X GET \\
  'https://api.patio-controle.com/api/admin/devices' \\
  -H 'Authorization: Bearer ${showToken ? apiToken : 'seu_token_aqui'}' \\
  -H 'Content-Type: application/json'

# Resposta
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}`}</code>
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(`curl -X GET 'https://api.patio-controle.com/api/admin/devices' -H 'Authorization: Bearer ${apiToken}' -H 'Content-Type: application/json'`)}
            className="btn btn-secondary btn-sm mt-3"
          >
            <Copy size={14} />
            Copiar comando
          </button>
        </div>
      </div>

      {/* Endpoints disponiveis */}
      <div className="card" id="endpoints">
        <div className="card-header">
          <h2 className="card-title">
            <Code size={18} className="mr-2" />
            Endpoints Disponiveis
          </h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Metodo</th>
                  <th>Endpoint</th>
                  <th>Descricao</th>
                  <th style={{ width: 100 }}>Auth</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((endpoint, index) => (
                  <tr key={index}>
                    <td>
                      <span
                        className={`badge ${
                          endpoint.method === 'GET'
                            ? 'badge-success'
                            : endpoint.method === 'POST'
                            ? 'badge-primary'
                            : endpoint.method === 'PUT'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {endpoint.method}
                      </span>
                    </td>
                    <td>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                    </td>
                    <td className="text-gray-600">{endpoint.description}</td>
                    <td>
                      {endpoint.auth && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Key size={14} />
                          Sim
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Zap className="text-blue-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-blue-900">Rate Limiting</h4>
              <p className="text-sm text-blue-700 mt-1">
                A API possui limite de 100 requisicoes por minuto por token.
                Headers de rate limit sao incluidos em todas as respostas.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <Shield className="text-green-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-green-900">Seguranca</h4>
              <p className="text-sm text-green-700 mt-1">
                Todas as requisicoes devem usar HTTPS. Tokens expiram apos 30 dias
                de inatividade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
