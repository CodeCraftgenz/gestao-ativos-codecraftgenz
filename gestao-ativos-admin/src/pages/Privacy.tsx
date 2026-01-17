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
  Database,
  Activity,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';

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
      const response = await api.get('/api/admin/lgpd/export', { responseType: 'blob' });

      // Criar blob e fazer download
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lgpd-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Exportacao de dados concluida com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados');
    }
  }

  if (loading) {
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
            <h1 className="page-title">Central de Privacidade - LGPD</h1>
            <p className="page-description">Gerencie a retencao e protecao de dados pessoais</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="alert alert-info mb-6">
        <Info className="alert-icon" />
        <div>
          <strong>Sobre a coleta de dados:</strong> Este sistema coleta dados de endereco IP e usuario logado para
          fins de seguranca patrimonial e auditoria de acesso. Os dados sao utilizados exclusivamente para
          identificar acessos nao autorizados e rastrear dispositivos em caso de furto ou uso indevido.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Activity />
            </div>
          </div>
          <div className="stat-card-value">{stats.total_heartbeats.toLocaleString()}</div>
          <div className="stat-card-label">
            Total de Heartbeats
            {stats.oldest_heartbeat && (
              <span className="block text-xs mt-1">
                Desde {new Date(stats.oldest_heartbeat).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Clock />
            </div>
          </div>
          <div className="stat-card-value">{stats.total_activity_events.toLocaleString()}</div>
          <div className="stat-card-label">
            Eventos de Atividade
            {stats.oldest_activity && (
              <span className="block text-xs mt-1">
                Desde {new Date(stats.oldest_activity).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Database />
            </div>
          </div>
          <div className="stat-card-value">{stats.total_ip_records.toLocaleString()}</div>
          <div className="stat-card-label">Registros de IP</div>
        </div>

        <div className="stat-card gray">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <CheckCircle />
            </div>
          </div>
          <div className="stat-card-value" style={{ fontSize: '1.25rem', color: 'var(--success-600)' }}>
            Conformidade OK
          </div>
          <div className="stat-card-label">Status LGPD</div>
        </div>
      </div>

      {/* Retention Settings */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">
            <Clock size={20} />
            Politica de Retencao de Dados
          </h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-500 mb-6">
            Configure por quanto tempo os dados serao mantidos antes de serem anonimizados ou excluidos.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="form-group">
              <label htmlFor="heartbeat_retention" className="form-label">Retencao de Heartbeats (dias)</label>
              <input
                id="heartbeat_retention"
                type="number"
                min="7"
                max="365"
                value={settings.heartbeat_retention_days}
                onChange={(e) => setSettings({ ...settings, heartbeat_retention_days: parseInt(e.target.value) || 90 })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Heartbeats mais antigos serao excluidos automaticamente.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="activity_retention" className="form-label">Retencao de Eventos de Atividade (dias)</label>
              <input
                id="activity_retention"
                type="number"
                min="30"
                max="730"
                value={settings.activity_retention_days}
                onChange={(e) => setSettings({ ...settings, activity_retention_days: parseInt(e.target.value) || 365 })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Eventos de boot, shutdown, login e logout.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="ip_anonymize" className="form-label">Anonimizar IPs apos (dias)</label>
              <input
                id="ip_anonymize"
                type="number"
                min="30"
                max="365"
                value={settings.ip_anonymize_after_days}
                onChange={(e) => setSettings({ ...settings, ip_anonymize_after_days: parseInt(e.target.value) || 180 })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                IPs serao mascarados (ex: 192.168.*.*) apos este periodo.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="user_anonymize" className="form-label">Anonimizar usuarios apos (dias)</label>
              <input
                id="user_anonymize"
                type="number"
                min="90"
                max="1095"
                value={settings.user_anonymize_after_days}
                onChange={(e) => setSettings({ ...settings, user_anonymize_after_days: parseInt(e.target.value) || 730 })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nomes de usuarios serao substituidos por identificadores anonimos.
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Salvando...' : 'Salvar Configuracoes'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">
            <Shield size={20} />
            Acoes de Dados
          </h2>
        </div>
        <div className="card-body space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Exporte ou exclua dados conforme exigido pela LGPD.
          </p>

          {/* Export */}
          <div className="quick-action">
            <div className="quick-action-content">
              <div className="quick-action-icon blue">
                <Download size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900">Exportar Dados</div>
                <div className="text-sm text-gray-500">
                  Baixe todos os dados coletados em formato JSON.
                </div>
              </div>
            </div>
            <button type="button" onClick={exportData} className="btn btn-secondary">
              Exportar
            </button>
          </div>

          {/* Delete Old */}
          <div className="quick-action">
            <div className="quick-action-content">
              <div className="quick-action-icon yellow">
                <Clock size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900">Limpar Dados Antigos</div>
                <div className="text-sm text-gray-500">
                  Exclui dados alem do periodo de retencao configurado.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteType('old');
                setShowDeleteModal(true);
              }}
              className="btn btn-secondary"
            >
              Limpar
            </button>
          </div>

          {/* Delete All */}
          <div className="quick-action" style={{ background: 'var(--danger-50)' }}>
            <div className="quick-action-content">
              <div className="quick-action-icon" style={{ background: 'var(--danger-100)', color: 'var(--danger-600)' }}>
                <Trash2 size={20} />
              </div>
              <div>
                <div className="font-medium text-gray-900">Excluir Todos os Dados</div>
                <div className="text-sm text-gray-500">
                  Remove permanentemente todos os dados de telemetria. Esta acao nao pode ser desfeita.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteType('all');
                setShowDeleteModal(true);
              }}
              className="btn btn-danger"
            >
              Excluir Tudo
            </button>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="card">
        <div className="card-body">
          <p className="text-sm text-gray-600">
            <strong>Aviso Legal:</strong> Em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018),
            os dados pessoais coletados sao utilizados exclusivamente para as finalidades descritas acima.
            O titular dos dados tem direito a solicitar acesso, correcao ou exclusao de seus dados a qualquer momento.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} style={{ color: 'var(--danger-500)' }} />
                <h3 className="modal-title">Confirmar Exclusao</h3>
              </div>
            </div>
            <div className="modal-body">
              <p className="text-gray-600">
                {deleteType === 'all'
                  ? 'Tem certeza que deseja excluir TODOS os dados de telemetria? Esta acao e irreversivel.'
                  : 'Tem certeza que deseja excluir os dados antigos? Esta acao e irreversivel.'}
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Confirmar Exclusao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
