import type { DeviceStatus } from '../types';

interface StatusBadgeProps {
  status: DeviceStatus;
}

const statusConfig: Record<DeviceStatus, { label: string; className: string }> = {
  online: { label: 'Online', className: 'badge-success' },
  offline: { label: 'Offline', className: 'badge-gray' },
  pending: { label: 'Pendente', className: 'badge-warning' },
  approved: { label: 'Aprovado', className: 'badge-info' },
  blocked: { label: 'Bloqueado', className: 'badge-danger' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-gray' };

  return (
    <span className={`badge ${config.className}`}>
      <span className="badge-dot"></span>
      {config.label}
    </span>
  );
}
