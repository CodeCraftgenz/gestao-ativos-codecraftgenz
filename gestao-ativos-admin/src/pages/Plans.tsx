import { useState, useEffect } from 'react';
import { Check, X, Zap, Building2, Rocket } from 'lucide-react';
// import { api } from '../services/api'; // Descomentar quando a API estiver pronta

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

const planColors: Record<string, string> = {
  basico: 'from-gray-500 to-gray-600',
  profissional: 'from-blue-500 to-blue-600',
  corporativo: 'from-purple-500 to-purple-600',
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
      // Por enquanto, vamos usar dados mockados enquanto a API nao esta pronta
      // const [plansRes, subRes, usageRes] = await Promise.all([
      //   api.get('/admin/plans'),
      //   api.get('/admin/subscription'),
      //   api.get('/admin/usage'),
      // ]);

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
    const statusStyles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const statusLabels: Record<string, string> = {
      active: 'Ativo',
      trial: 'Periodo de Teste',
      canceled: 'Cancelado',
      expired: 'Expirado',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.expired}`}>
        {statusLabels[status] || status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === subscription?.plan_id);
  const usagePercent = getUsagePercent();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos e Assinatura</h1>
        <p className="text-gray-600">Gerencie seu plano e veja seu uso atual</p>
      </div>

      {/* Current Plan Status */}
      {subscription && currentPlan && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Plano Atual: {currentPlan.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(subscription.status)}
                {subscription.trial_ends_at && (
                  <span className="text-sm text-gray-500">
                    Teste expira em {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
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
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {usagePercent >= 80 && (
              <p className="text-sm text-orange-600">
                Voce esta proximo do limite do seu plano. Considere fazer upgrade.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.slug] || Zap;
          const colorClass = planColors[plan.slug] || planColors.basico;
          const isCurrentPlan = plan.id === subscription?.plan_id;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Plano Atual</span>
                    )}
                  </div>
                </div>
                <p className="text-white/80 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="p-6 border-b">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.price_monthly_cents)}
                  </span>
                  {plan.price_monthly_cents > 0 && (
                    <span className="text-gray-500">/mes</span>
                  )}
                </div>
                {plan.price_yearly_cents > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    ou {formatPrice(plan.price_yearly_cents)}/ano (economia de 16%)
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">
                    Ate {plan.max_devices === 999999 ? 'ilimitados' : plan.max_devices} dispositivos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">
                    Ate {plan.max_users === 999 ? 'ilimitados' : plan.max_users} usuarios
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">
                    Ate {plan.max_filiais === 999 ? 'ilimitadas' : plan.max_filiais} filiais
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">{plan.data_retention_days} dias de retencao</span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_alerts ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={plan.feature_alerts ? 'text-gray-700' : 'text-gray-400'}>
                    Alertas automaticos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_reports ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={plan.feature_reports ? 'text-gray-700' : 'text-gray-400'}>
                    Relatorios avancados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_geoip ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={plan.feature_geoip ? 'text-gray-700' : 'text-gray-400'}>
                    Geolocalizacao por IP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_api_access ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={plan.feature_api_access ? 'text-gray-700' : 'text-gray-400'}>
                    Acesso a API
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button
                  className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Plano Atual' : 'Assinar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ or Contact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Precisa de mais?</h3>
        <p className="text-gray-600">
          Entre em contato conosco para planos personalizados ou para tirar duvidas sobre recursos especificos.
        </p>
        <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
          Falar com vendas
        </button>
      </div>
    </div>
  );
}
