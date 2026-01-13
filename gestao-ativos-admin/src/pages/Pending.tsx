import { useEffect, useState } from 'react';
import { RefreshCw, Check, X, Monitor, AlertCircle, CheckCircle } from 'lucide-react';
import type { Device } from '../types';
import { devicesService } from '../services/devices.service';

export function Pending() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState<number | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setIsLoading(true);
      const data = await devicesService.getPending();
      setDevices(data);
    } catch (err) {
      setError('Erro ao carregar dispositivos pendentes');
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await devicesService.approve(id);
      setDevices(devices.filter((d) => d.id !== id));
    } catch (err) {
      setError('Erro ao aprovar dispositivo');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async () => {
    if (!showBlockModal || !blockReason.trim()) return;

    try {
      setActionLoading(showBlockModal);
      await devicesService.block(showBlockModal, blockReason);
      setDevices(devices.filter((d) => d.id !== showBlockModal));
      setShowBlockModal(null);
      setBlockReason('');
    } catch (err) {
      setError('Erro ao bloquear dispositivo');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Dispositivos Pendentes</h1>
            <p className="page-description">
              Aprovar ou rejeitar dispositivos aguardando autorização
            </p>
          </div>
          <button
            type="button"
            onClick={loadDevices}
            className="btn btn-secondary"
          >
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : devices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon success">
              <CheckCircle />
            </div>
            <h3 className="empty-state-title">Nenhum dispositivo pendente</h3>
            <p className="empty-state-description">
              Novos dispositivos aparecerão aqui após a instalação do agente
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <div key={device.id} className="pending-card">
              <div className="pending-card-header">
                <div className="pending-icon">
                  <Monitor />
                </div>
                <div className="pending-info">
                  <h3 className="pending-hostname">{device.hostname}</h3>
                  <div className="pending-details">
                    <div className="pending-detail">
                      <span className="pending-detail-label">Serial BIOS:</span>
                      <span>{device.serial_bios || 'N/A'}</span>
                    </div>
                    <div className="pending-detail">
                      <span className="pending-detail-label">MAC:</span>
                      <span>{device.primary_mac_address || 'N/A'}</span>
                    </div>
                    <div className="pending-detail">
                      <span className="pending-detail-label">SO:</span>
                      <span>{device.os_name} {device.os_version}</span>
                    </div>
                    <div className="pending-detail">
                      <span className="pending-detail-label">Usuário:</span>
                      <span>{device.assigned_user || 'N/A'}</span>
                    </div>
                    <div className="pending-detail">
                      <span className="pending-detail-label">Registrado:</span>
                      <span>{formatDate(device.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pending-actions">
                <button
                  type="button"
                  onClick={() => handleApprove(device.id)}
                  disabled={actionLoading === device.id}
                  className="btn btn-success"
                >
                  {actionLoading === device.id ? (
                    <div className="spinner spinner-sm"></div>
                  ) : (
                    <Check size={18} />
                  )}
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(device.id)}
                  disabled={actionLoading === device.id}
                  className="btn btn-danger"
                >
                  <X size={18} />
                  Bloquear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Bloquear Dispositivo</h3>
            </div>
            <div className="modal-body">
              <p className="text-gray-600 mb-4">
                Informe o motivo do bloqueio deste dispositivo:
              </p>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="input"
                placeholder="Motivo do bloqueio..."
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowBlockModal(null);
                  setBlockReason('');
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={!blockReason.trim() || actionLoading !== null}
                className="btn btn-danger"
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
