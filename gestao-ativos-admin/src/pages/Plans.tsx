import { useState, useEffect } from 'react';
import { Check, X, Zap, Building2, Rocket, CreditCard, TrendingUp } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  max_devices: number;
  max_users: number;
  max_filiais: number;
  feature_alerts: boolean;
  feature_reports: boolean;
  feature_geoip: boolean;
  feature_api_access: boolean;
  data_retention_days: number;
  price_monthly_cents: number;
  price_yearly_cents: number;
  is_active: boolean;
  is_default: boolean;
}

interface Subscription {
  id: number;
  plan_id: number;
  plan_name: string;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
}

interface UsageStats {
  devices_count: number;
  users_count: number;
  filiais_count: number;
}

const planIcons: Record<string, React.ElementType> = {
  basico: Zap,
  profissional: Building2,
  corporativo: Rocket,
};

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ devices_count: 0, users_count: 0, filiais_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Mock data
      setPlans([
        {
          id: 1,
          name: 'Basico',
          slug: 'basico',
          description: 'Ideal para pequenos negocios',
          max_devices: 5,
          max_users: 1,
          max_filiais: 1,
          feature_alerts: false,
          feature_reports: false,
          feature_geoip: false,
          feature_api_access: false,
          data_retention_days: 30,
          price_monthly_cents: 0,
          price_yearly_cents: 0,
          is_active: true,
          is_default: true,
        },
        {
          id: 2,
          name: 'Profissional',
          slug: 'profissional',
          description: 'Para empresas em crescimento',
          max_devices: 20,
          max_users: 3,
          max_filiais: 3,
          feature_alerts: true,
          feature_reports: true,
          feature_geoip: false,
          feature_api_access: false,
          data_retention_days: 90,
          price_monthly_cents: 9900,
          price_yearly_cents: 99900,
          is_active: true,
          is_default: false,
        },
        {
          id: 3,
          name: 'Corporativo',
          slug: 'corporativo',
          description: 'Solucao completa para grandes empresas',
          max_devices: 999999,
          max_users: 999,
          max_filiais: 999,
          feature_alerts: true,
          feature_reports: true,
          feature_geoip: true,
          feature_api_access: true,
          data_retention_days: 365,
          price_monthly_cents: 29900,
          price_yearly_cents: 299900,
          is_active: true,
          is_default: false,
        },
      ]);

      setSubscription({
        id: 1,
        plan_id: 1,
        plan_name: 'Basico',
        status: 'trial',
        started_at: new Date().toISOString(),
        expires_at: null,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setUsage({
        devices_count: 3,
        users_count: 1,
        filiais_count: 1,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(cents: number): string {
    if (cents === 0) return 'Gratis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  }

  function getUsagePercent(): number {
    if (!subscription) return 0;
    const currentPlan = plans.find(p => p.id === subscription.plan_id);
    if (!currentPlan) return 0;
    return Math.min(100, (usage.devices_count / currentPlan.max_devices) * 100);
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { class: string; label: string }> = {
      active: { class: 'badge-success', label: 'Ativo' },
      trial: { class: 'badge-info', label: 'Periodo de Teste' },
      canceled: { class: 'badge-danger', label: 'Cancelado' },
      expired: { class: 'badge-gray', label: 'Expirado' },
    };

    const config = statusConfig[status] || statusConfig.expired;

    return (
      <span className={`badge ${config.class}`}>
        <span className="badge-dot"></span>
        {config.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === subscription?.plan_id);
  const usagePercent = getUsagePercent();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Planos e Assinatura</h1>
            <p className="page-description">Gerencie seu plano e acompanhe o uso do sistema</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card blue">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <CreditCard />
            </div>
          </div>
          <div className="stat-card-value">{currentPlan?.name || '-'}</div>
          <div className="stat-card-label">Plano Atual</div>
        </div>

        <div className="stat-card green">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <TrendingUp />
            </div>
          </div>
          <div className="stat-card-value">{usage.devices_count}</div>
          <div className="stat-card-label">Dispositivos em Uso</div>
        </div>

        <div className="stat-card gray">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Zap />
            </div>
          </div>
          <div className="stat-card-value">{currentPlan?.max_devices === 999999 ? 'Ilimitado' : currentPlan?.max_devices || 0}</div>
          <div className="stat-card-label">Limite de Dispositivos</div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <Building2 />
            </div>
          </div>
          <div className="stat-card-value">{currentPlan?.data_retention_days || 0}</div>
          <div className="stat-card-label">Dias de Retencao</div>
        </div>
      </div>

      {/* Current Plan Status */}
      {subscription && currentPlan && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">Status da Assinatura</h2>
            {getStatusBadge(subscription.status)}
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">Plano {currentPlan.name}</div>
                {subscription.trial_ends_at && (
                  <div className="text-sm text-gray-500">
                    Teste expira em {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {usage.devices_count} / {currentPlan.max_devices === 999999 ? 'Ilimitado' : currentPlan.max_devices}
                </div>
                <div className="text-sm text-gray-500">dispositivos</div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uso do plano</span>
                <span className="font-medium text-gray-900">{usagePercent.toFixed(0)}%</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className={`progress-bar ${usagePercent >= 90 ? 'danger' : usagePercent >= 70 ? 'warning' : 'success'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 80 && (
                <div className="alert alert-warning mt-4">
                  <TrendingUp className="alert-icon" />
                  <span>Voce esta proximo do limite do seu plano. Considere fazer upgrade.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="page-header mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Planos Disponiveis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.slug] || Zap;
          const isCurrentPlan = plan.id === subscription?.plan_id;

          return (
            <div
              key={plan.id}
              className={`card ${isCurrentPlan ? 'border-2 border-primary-500' : ''}`}
              style={isCurrentPlan ? { borderColor: 'var(--primary-500)', borderWidth: '2px' } : {}}
            >
              {/* Plan Header */}
              <div className="card-header" style={{ background: 'var(--gray-50)' }}>
                <div className="flex items-center gap-3">
                  <div className="stat-card-icon" style={{ width: '40px', height: '40px' }}>
                    <Icon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="badge badge-info" style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                        Plano Atual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="card-body" style={{ borderBottom: '1px solid var(--gray-100)' }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(plan.price_monthly_cents)}
                  </span>
                  {plan.price_monthly_cents > 0 && (
                    <span className="text-gray-500 text-sm">/mes</span>
                  )}
                </div>
                {plan.price_yearly_cents > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    ou {formatPrice(plan.price_yearly_cents)}/ano
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="card-body space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="text-success-500" style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  <span className="text-sm text-gray-700">
                    Ate {plan.max_devices === 999999 ? 'ilimitados' : plan.max_devices} dispositivos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  <span className="text-sm text-gray-700">
                    Ate {plan.max_users === 999 ? 'ilimitados' : plan.max_users} usuarios
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  <span className="text-sm text-gray-700">
                    {plan.data_retention_days} dias de retencao
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_alerts ? (
                    <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  ) : (
                    <X style={{ width: '18px', height: '18px', color: 'var(--gray-300)' }} />
                  )}
                  <span className={`text-sm ${plan.feature_alerts ? 'text-gray-700' : 'text-gray-400'}`}>
                    Alertas automaticos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_reports ? (
                    <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  ) : (
                    <X style={{ width: '18px', height: '18px', color: 'var(--gray-300)' }} />
                  )}
                  <span className={`text-sm ${plan.feature_reports ? 'text-gray-700' : 'text-gray-400'}`}>
                    Relatorios avancados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_geoip ? (
                    <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  ) : (
                    <X style={{ width: '18px', height: '18px', color: 'var(--gray-300)' }} />
                  )}
                  <span className={`text-sm ${plan.feature_geoip ? 'text-gray-700' : 'text-gray-400'}`}>
                    Geolocalizacao por IP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_api_access ? (
                    <Check style={{ width: '18px', height: '18px', color: 'var(--success-500)' }} />
                  ) : (
                    <X style={{ width: '18px', height: '18px', color: 'var(--gray-300)' }} />
                  )}
                  <span className={`text-sm ${plan.feature_api_access ? 'text-gray-700' : 'text-gray-400'}`}>
                    Acesso a API
                  </span>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    className={`btn w-full ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Assinar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Section */}
      <div className="card mt-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Precisa de mais recursos?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Entre em contato para planos personalizados ou para tirar duvidas.
              </p>
            </div>
            <button className="btn btn-secondary">
              Falar com vendas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
