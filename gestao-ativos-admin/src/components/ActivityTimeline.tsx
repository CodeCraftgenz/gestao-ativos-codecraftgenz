import { useState, useEffect } from 'react';
import {
  Power,
  PowerOff,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  Clock,
  MapPin,
  User,
  RefreshCw,
} from 'lucide-react';

interface ActivityEvent {
  id: number;
  event_type: 'boot' | 'shutdown' | 'login' | 'logout' | 'lock' | 'unlock';
  occurred_at: string;
  logged_user: string | null;
  ip_address: string | null;
  duration_seconds: number | null;
  details: Record<string, unknown> | null;
}

interface ActivityTimelineProps {
  deviceId: number;
  limit?: number;
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  boot: {
    icon: Power,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Maquina iniciada',
  },
  shutdown: {
    icon: PowerOff,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Maquina desligada',
  },
  login: {
    icon: LogIn,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Usuario logou',
  },
  logout: {
    icon: LogOut,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Usuario deslogou',
  },
  lock: {
    icon: Lock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Tela bloqueada',
  },
  unlock: {
    icon: Unlock,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Tela desbloqueada',
  },
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}min`;
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  const date = new Date(dateStr);
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function groupEventsByDate(events: ActivityEvent[]): Record<string, ActivityEvent[]> {
  return events.reduce((groups, event) => {
    const date = new Date(event.occurred_at).toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, ActivityEvent[]>);
}

export function ActivityTimeline({ deviceId, limit: _limit = 50 }: ActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [deviceId]);

  async function loadEvents() {
    try {
      setLoading(true);
      // const response = await api.get(`/admin/devices/${deviceId}/activity-events?limit=${limit}`);
      // setEvents(response.data.data);

      // Mock data
      const mockEvents: ActivityEvent[] = [
        {
          id: 1,
          event_type: 'boot',
          occurred_at: new Date().toISOString(),
          logged_user: null,
          ip_address: '192.168.1.100',
          duration_seconds: null,
          details: null,
        },
        {
          id: 2,
          event_type: 'login',
          occurred_at: new Date(Date.now() - 5 * 60000).toISOString(),
          logged_user: 'joao.silva',
          ip_address: '192.168.1.100',
          duration_seconds: null,
          details: null,
        },
        {
          id: 3,
          event_type: 'logout',
          occurred_at: new Date(Date.now() - 8 * 3600000).toISOString(),
          logged_user: 'joao.silva',
          ip_address: '192.168.1.100',
          duration_seconds: 28800,
          details: null,
        },
        {
          id: 4,
          event_type: 'login',
          occurred_at: new Date(Date.now() - 16 * 3600000).toISOString(),
          logged_user: 'joao.silva',
          ip_address: '192.168.1.100',
          duration_seconds: null,
          details: null,
        },
        {
          id: 5,
          event_type: 'boot',
          occurred_at: new Date(Date.now() - 16 * 3600000 - 5 * 60000).toISOString(),
          logged_user: null,
          ip_address: '192.168.1.100',
          duration_seconds: null,
          details: null,
        },
        {
          id: 6,
          event_type: 'shutdown',
          occurred_at: new Date(Date.now() - 24 * 3600000).toISOString(),
          logged_user: null,
          ip_address: '192.168.1.100',
          duration_seconds: 32400,
          details: null,
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum evento de atividade registrado</p>
      </div>
    );
  }

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-sm font-medium text-gray-500 px-2">{date}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Events */}
          <div className="space-y-3">
            {dateEvents.map((event, index) => {
              const config = eventConfig[event.event_type] || eventConfig.boot;
              const Icon = config.icon;
              const { time } = formatDateTime(event.occurred_at);
              const isLast = index === dateEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-3">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{config.label}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {time}
                          </span>
                          {event.logged_user && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {event.logged_user}
                            </span>
                          )}
                          {event.ip_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.duration_seconds && (
                        <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          Duracao: {formatDuration(event.duration_seconds)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
