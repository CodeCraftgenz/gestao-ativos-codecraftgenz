import { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Trash2,
  Download,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
} from 'lucide-react';

interface LgpdSettings {
  heartbeat_retention_days: number;
  activity_retention_days: number;
  ip_anonymize_after_days: number;
  user_anonymize_after_days: number;
}

interface DataStats {
  total_heartbeats: number;
  total_activity_events: number;
  total_ip_records: number;
  oldest_heartbeat: string | null;
  oldest_activity: string | null;
}

export function Privacy() {
  const [settings, setSettings] = useState<LgpdSettings>({
    heartbeat_retention_days: 90,
    activity_retention_days: 365,
    ip_anonymize_after_days: 180,
    user_anonymize_after_days: 730,
  });
  const [stats, setStats] = useState<DataStats>({
    total_heartbeats: 0,
    total_activity_events: 0,
    total_ip_records: 0,
    oldest_heartbeat: null,
    oldest_activity: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'old' | 'device'>('old');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      // Mock data - substituir por chamadas reais da API
      setSettings({
        heartbeat_retention_days: 90,
        activity_retention_days: 365,
        ip_anonymize_after_days: 180,
        user_anonymize_after_days: 730,
      });

      setStats({
        total_heartbeats: 15234,
        total_activity_events: 892,
        total_ip_records: 45,
        oldest_heartbeat: '2024-10-15T08:30:00Z',
        oldest_activity: '2024-11-01T10:00:00Z',
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);
      // await api.put('/admin/lgpd/settings', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay
      alert('Configuracoes salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      // await api.delete('/admin/lgpd/data', { data: { type: deleteType } });
      alert(`Dados ${deleteType === 'all' ? 'todos' : 'antigos'} excluidos com sucesso!`);
      setShowDeleteModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir dados');
    }
  }

  async function exportData() {
    try {
      // const response = await api.get('/admin/lgpd/export', { responseType: 'blob' });
      // const url = window.URL.createObjectURL(response.data);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `dados-lgpd-${new Date().toISOString().split('T')[0]}.json`;
      // a.click();
      alert('Exportacao de dados iniciada. O arquivo sera baixado em breve.');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Privacidade - LGPD</h1>
          <p className="text-gray-600">Gerencie a retencao e protecao de dados pessoais</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900">Sobre a coleta de dados</h3>
          <p className="text-sm text-blue-800 mt-1">
            Este sistema coleta dados de <strong>endereco IP</strong> e <strong>usuario logado</strong> para
            fins de <strong>seguranca patrimonial</strong> e <strong>auditoria de acesso</strong>.
            Os dados sao utilizados exclusivamente para identificar acessos nao autorizados e
            rastrear dispositivos em caso de furto ou uso indevido.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total de Heartbeats</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_heartbeats.toLocaleString()}</div>
          {stats.oldest_heartbeat && (
            <div className="text-xs text-gray-400 mt-1">
              Desde {new Date(stats.oldest_heartbeat).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Eventos de Atividade</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_activity_events.toLocaleString()}</div>
          {stats.oldest_activity && (
            <div className="text-xs text-gray-400 mt-1">
              Desde {new Date(stats.oldest_activity).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Registros de IP</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total_ip_records.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Status LGPD</div>
          <div className="text-lg font-bold text-green-600">Conformidade OK</div>
        </div>
      </div>

      {/* Retention Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Politica de Retencao de Dados</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure por quanto tempo os dados serao mantidos antes de serem anonimizados ou excluidos.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retencao de Heartbeats (dias)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={settings.heartbeat_retention_days}
                onChange={(e) => setSettings({ ...settings, heartbeat_retention_days: parseInt(e.target.value) || 90 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Heartbeats mais antigos serao excluidos automaticamente.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retencao de Eventos de Atividade (dias)
              </label>
              <input
                type="number"
                min="30"
                max="730"
                value={settings.activity_retention_days}
                onChange={(e) => setSettings({ ...settings, activity_retention_days: parseInt(e.target.value) || 365 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Eventos de boot, shutdown, login e logout.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anonimizar IPs apos (dias)
              </label>
              <input
                type="number"
                min="30"
                max="365"
                value={settings.ip_anonymize_after_days}
                onChange={(e) => setSettings({ ...settings, ip_anonymize_after_days: parseInt(e.target.value) || 180 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                IPs serao mascarados (ex: 192.168.*.*) apos este periodo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anonimizar usuarios apos (dias)
              </label>
              <input
                type="number"
                min="90"
                max="1095"
                value={settings.user_anonymize_after_days}
                onChange={(e) => setSettings({ ...settings, user_anonymize_after_days: parseInt(e.target.value) || 730 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nomes de usuarios serao substituidos por identificadores anonimos.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Configuracoes'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Acoes de Dados</h2>
          <p className="text-sm text-gray-500 mt-1">
            Exporte ou exclua dados conforme exigido pela LGPD.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Exportar Dados</div>
                <div className="text-sm text-gray-500">
                  Baixe todos os dados coletados em formato JSON.
                </div>
              </div>
            </div>
            <button
              onClick={exportData}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Exportar
            </button>
          </div>

          {/* Delete Old */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-gray-900">Limpar Dados Antigos</div>
                <div className="text-sm text-gray-500">
                  Exclui dados alem do periodo de retencao configurado.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setDeleteType('old');
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 text-yellow-600 border border-yellow-600 rounded-lg hover:bg-yellow-50"
            >
              Limpar
            </button>
          </div>

          {/* Delete All */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-gray-900">Excluir Todos os Dados</div>
                <div className="text-sm text-gray-500">
                  Remove permanentemente todos os dados de telemetria. Esta acao nao pode ser desfeita.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setDeleteType('all');
                setShowDeleteModal(true);
              }}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-100"
            >
              Excluir Tudo
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Confirmar Exclusao</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {deleteType === 'all'
                ? 'Tem certeza que deseja excluir TODOS os dados de telemetria? Esta acao e irreversivel.'
                : 'Tem certeza que deseja excluir os dados antigos? Esta acao e irreversivel.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmar Exclusao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notice */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <strong>Aviso Legal:</strong> Em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018),
        os dados pessoais coletados sao utilizados exclusivamente para as finalidades descritas acima.
        O titular dos dados tem direito a solicitar acesso, correcao ou exclusao de seus dados a qualquer momento.
      </div>
    </div>
  );
}
