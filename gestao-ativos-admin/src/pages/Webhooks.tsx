import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  Webhook,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  CheckCircle,
  Lock,
  Crown,
  TrendingUp,
  Zap,
  Bell,
  RefreshCw,
  X,
} from 'lucide-react';

interface WebhookConfig {
  id: number;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  lastStatus?: 'success' | 'error';
  totalCalls: number;
  totalFailures: number;
}

const availableEvents = [
  { id: 'device.connected', name: 'Dispositivo Conectado', description: 'Quando um dispositivo se conecta ao sistema' },
  { id: 'device.disconnected', name: 'Dispositivo Desconectado', description: 'Quando um dispositivo perde conexao' },
  { id: 'device.alert', name: 'Alerta de Dispositivo', description: 'Quando um alerta e gerado' },
  { id: 'software.installed', name: 'Software Instalado', description: 'Quando um novo software e detectado' },
  { id: 'software.uninstalled', name: 'Software Desinstalado', description: 'Quando um software e removido' },
  { id: 'user.login', name: 'Login de Usuario', description: 'Quando um usuario faz login no painel' },
];

export default function Webhooks() {
  const { hasFeature, plan } = useSubscription();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: 1,
      name: 'Notificacao Slack',
      url: 'https://hooks.slack.com/services/xxx',
      events: ['device.alert', 'device.disconnected'],
      isActive: true,
      lastTriggered: '2025-01-17T10:30:00',
      lastStatus: 'success',
      totalCalls: 156,
      totalFailures: 2,
    },
    {
      id: 2,
      name: 'Integracao Jira',
      url: 'https://api.jira.com/webhook/xxx',
      events: ['device.alert'],
      isActive: false,
      lastTriggered: '2025-01-16T15:45:00',
      lastStatus: 'error',
      totalCalls: 89,
      totalFailures: 12,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const hasAccess = hasFeature('webhooks');

  const handleToggleActive = (id: number) => {
    setWebhooks(webhooks.map(w =>
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este webhook?')) {
      setWebhooks(webhooks.filter(w => w.id !== id));
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingWebhook(null);
    setFormData({ name: '', url: '', events: [] });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingWebhook) {
      setWebhooks(webhooks.map(w =>
        w.id === editingWebhook.id ? { ...w, ...formData } : w
      ));
    } else {
      setWebhooks([...webhooks, {
        id: Date.now(),
        ...formData,
        isActive: true,
        totalCalls: 0,
        totalFailures: 0,
      }]);
    }
    setShowModal(false);
  };

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Webhooks</h1>
            <p className="page-description">Receba notificacoes em tempo real</p>
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
              Webhooks estao disponiveis no plano Empresarial.
              Receba notificacoes em tempo real quando eventos ocorrem no sistema.
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
                <Zap size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Tempo Real</h3>
                <p className="text-sm text-gray-500">Notificacoes instantaneas</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Bell size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Multiplos Eventos</h3>
                <p className="text-sm text-gray-500">6 tipos de eventos</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <RefreshCw size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Retry Automatico</h3>
                <p className="text-sm text-gray-500">Reenvio em falhas</p>
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
            <h1 className="page-title">Webhooks</h1>
            <p className="page-description">
              Configure webhooks para receber notificacoes em tempo real
            </p>
          </div>
          <div className="page-header-actions">
            <button onClick={handleNew} className="btn btn-primary">
              <Plus size={16} />
              Novo Webhook
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
                <p className="text-sm text-gray-500">Total Webhooks</p>
                <p className="text-2xl font-bold text-gray-900">{webhooks.length}</p>
              </div>
              <Webhook className="text-primary" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{webhooks.filter(w => w.isActive).length}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Chamadas</p>
                <p className="text-2xl font-bold text-gray-900">{webhooks.reduce((acc, w) => acc + w.totalCalls, 0)}</p>
              </div>
              <Zap className="text-blue-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taxa Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {webhooks.length > 0
                    ? Math.round((1 - webhooks.reduce((acc, w) => acc + w.totalFailures, 0) / Math.max(webhooks.reduce((acc, w) => acc + w.totalCalls, 0), 1)) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Webhooks Configurados</h2>
        </div>
        <div className="card-body p-0">
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum webhook configurado</p>
              <button onClick={handleNew} className="btn btn-primary mt-4">
                <Plus size={16} />
                Criar Primeiro Webhook
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>URL</th>
                    <th>Eventos</th>
                    <th>Ultimo Disparo</th>
                    <th>Status</th>
                    <th style={{ width: 150 }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((webhook) => (
                    <tr key={webhook.id}>
                      <td>
                        <div className="font-medium text-gray-900">{webhook.name}</div>
                        <div className="text-xs text-gray-500">
                          {webhook.totalCalls} chamadas, {webhook.totalFailures} falhas
                        </div>
                      </td>
                      <td>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {webhook.url.substring(0, 40)}...
                        </code>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <span key={event} className="badge badge-secondary text-xs">
                              {availableEvents.find(e => e.id === event)?.name || event}
                            </span>
                          ))}
                          {webhook.events.length > 2 && (
                            <span className="badge badge-secondary text-xs">+{webhook.events.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {webhook.lastTriggered ? (
                          <div>
                            <div className="text-sm">{new Date(webhook.lastTriggered).toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs text-gray-500">{new Date(webhook.lastTriggered).toLocaleTimeString('pt-BR')}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td>
                        {webhook.isActive ? (
                          <span className="badge badge-success">Ativo</span>
                        ) : (
                          <span className="badge badge-secondary">Pausado</span>
                        )}
                        {webhook.lastStatus === 'error' && (
                          <span className="badge badge-danger ml-1">Erro</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleActive(webhook.id)}
                            className="btn btn-sm btn-ghost"
                            title={webhook.isActive ? 'Pausar' : 'Ativar'}
                          >
                            {webhook.isActive ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button
                            onClick={() => handleEdit(webhook)}
                            className="btn btn-sm btn-ghost"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(webhook.id)}
                            className="btn btn-sm btn-ghost text-red-500"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
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
          <Zap className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Como funcionam os Webhooks?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Webhooks permitem que seu sistema receba notificacoes em tempo real quando eventos
              ocorrem no Patio de Controle. Configure uma URL de destino e selecione os eventos
              que deseja monitorar. Cada evento enviara um POST com os detalhes em formato JSON.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingWebhook ? 'Editar Webhook' : 'Novo Webhook'}
              </h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Notificacao Slack"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">URL do Webhook</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://exemplo.com/webhook"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Eventos</label>
                <div className="space-y-2 mt-2">
                  {availableEvents.map(event => (
                    <label key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{event.name}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                disabled={!formData.name || !formData.url || formData.events.length === 0}
              >
                {editingWebhook ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
