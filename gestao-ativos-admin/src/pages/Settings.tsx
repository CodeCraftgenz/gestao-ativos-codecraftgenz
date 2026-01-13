import { useState } from 'react';
import { Save, Key, Bell, Shield, CheckCircle } from 'lucide-react';

export function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Configurações</h1>
            <p className="page-description">Configurações do sistema de gestão de ativos</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="alert alert-success mb-6">
          <CheckCircle size={20} />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      <div className="grid gap-6">
        {/* Agent Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-primary-600" />
              <h2 className="card-title">Configurações do Agente</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid gap-6">
              <div className="form-group">
                <label htmlFor="heartbeat" className="form-label">
                  Intervalo de Heartbeat (segundos)
                </label>
                <input
                  id="heartbeat"
                  type="number"
                  defaultValue={60}
                  className="input input-sm"
                  min={30}
                  max={300}
                  placeholder="60"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Com que frequência o agente envia sinais de vida
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="timeout" className="form-label">
                  Timeout para Offline (segundos)
                </label>
                <input
                  id="timeout"
                  type="number"
                  defaultValue={180}
                  className="input input-sm"
                  min={60}
                  max={600}
                  placeholder="180"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tempo sem heartbeat para considerar dispositivo offline
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="inventory" className="form-label">
                  Intervalo de Inventário (horas)
                </label>
                <input
                  id="inventory"
                  type="number"
                  defaultValue={24}
                  className="input input-sm"
                  min={1}
                  max={168}
                  placeholder="24"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Com que frequência o agente coleta inventário completo
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoApprove"
                />
                <label htmlFor="autoApprove" className="text-sm text-gray-700">
                  Aprovar dispositivos automaticamente
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-primary-600" />
              <h2 className="card-title">Segurança</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid gap-6">
              <div className="form-group">
                <label htmlFor="minVersion" className="form-label">
                  Versão Mínima do Agente
                </label>
                <input
                  id="minVersion"
                  type="text"
                  defaultValue="1.0.0"
                  className="input input-sm"
                  placeholder="1.0.0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Agentes com versão inferior serão rejeitados
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="commandExpiry" className="form-label">
                  Expiração de Comandos (horas)
                </label>
                <input
                  id="commandExpiry"
                  type="number"
                  defaultValue={24}
                  className="input input-sm"
                  min={1}
                  max={168}
                  placeholder="24"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Comandos não executados serão expirados após este tempo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-primary-600" />
              <h2 className="card-title">Notificações</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyNewDevice"
                  defaultChecked
                />
                <label htmlFor="notifyNewDevice" className="text-sm text-gray-700">
                  Notificar quando novo dispositivo for registrado
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyOffline"
                />
                <label htmlFor="notifyOffline" className="text-sm text-gray-700">
                  Notificar quando dispositivo ficar offline
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifyCommandFail"
                  defaultChecked
                />
                <label htmlFor="notifyCommandFail" className="text-sm text-gray-700">
                  Notificar quando comando falhar
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={handleSave} className="btn btn-primary">
            <Save size={18} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
