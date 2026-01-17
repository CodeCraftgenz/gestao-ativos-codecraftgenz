import { useState } from 'react';
import { Webhook, Plus, Trash2, Edit2, Play, Pause, AlertCircle, CheckCircle } from 'lucide-react';

interface WebhookConfig {
  id: number;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  lastStatus?: 'success' | 'error';
}

const availableEvents = [
  { id: 'device.connected', name: 'Dispositivo Conectado' },
  { id: 'device.disconnected', name: 'Dispositivo Desconectado' },
  { id: 'device.alert', name: 'Alerta de Dispositivo' },
  { id: 'software.installed', name: 'Software Instalado' },
  { id: 'software.uninstalled', name: 'Software Desinstalado' },
  { id: 'user.login', name: 'Login de Usuario' },
];

export default function Webhooks() {
  const [webhooks] = useState<WebhookConfig[]>([
    {
      id: 1,
      name: 'Notificacao Slack',
      url: 'https://hooks.slack.com/services/xxx',
      events: ['device.alert', 'device.disconnected'],
      isActive: true,
      lastTriggered: '2025-01-17T10:30:00',
      lastStatus: 'success',
    },
    {
      id: 2,
      name: 'Integracao Jira',
      url: 'https://api.jira.com/webhook/xxx',
      events: ['device.alert'],
      isActive: false,
      lastTriggered: '2025-01-16T15:45:00',
      lastStatus: 'error',
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Webhook className="text-primary" />
            Webhooks
          </h1>
          <p className="text-gray-400 mt-1">
            Configure webhooks para receber notificacoes em tempo real
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Webhook
        </button>
      </div>

      {/* Lista de Webhooks */}
      <div className="grid gap-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                  {webhook.isActive ? (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                      <Pause size={12} />
                      Pausado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1 font-mono">{webhook.url}</p>

                {/* Eventos */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {webhook.events.map((event) => (
                    <span
                      key={event}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                    >
                      {availableEvents.find((e) => e.id === event)?.name || event}
                    </span>
                  ))}
                </div>

                {/* Status do ultimo disparo */}
                {webhook.lastTriggered && (
                  <div className="flex items-center gap-2 mt-3 text-sm">
                    {webhook.lastStatus === 'success' ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400" />
                    )}
                    <span className="text-gray-400">
                      Ultimo disparo: {new Date(webhook.lastTriggered).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Acoes */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={webhook.isActive ? 'Pausar' : 'Ativar'}
                >
                  {webhook.isActive ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal (placeholder) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Novo Webhook</h2>
            <p className="text-gray-400 mb-4">
              Funcionalidade em desenvolvimento. Em breve voce podera criar webhooks personalizados.
            </p>
            <button
              onClick={() => setShowForm(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">Como funcionam os Webhooks?</h3>
        <p className="text-gray-300 text-sm">
          Webhooks permitem que seu sistema receba notificacoes em tempo real quando eventos
          ocorrem no Patio de Controle. Configure uma URL de destino e selecione os eventos
          que deseja monitorar. Cada evento enviara um POST com os detalhes em formato JSON.
        </p>
      </div>
    </div>
  );
}
