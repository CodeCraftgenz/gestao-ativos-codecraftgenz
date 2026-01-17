import { useState, useEffect } from 'react';
import { Check, X, Zap, Building2, CreditCard, TrendingUp, Shield, Crown, Star, Loader2 } from 'lucide-react';
import { plansService } from '../services/plans.service';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { Plan, Subscription } from '../types';

// Estende Plan com campos opcionais do frontend
interface PlanUI extends Plan {
  highlight?: boolean;
}

interface UsageStats {
  devices_count: number;
  users_count: number;
  filiais_count: number;
}

const planIcons: Record<string, React.ElementType> = {
  gratuito: Zap,
  basico: Star,
  profissional: Building2,
  empresarial: Crown,
};

const planColors: Record<string, string> = {
  gratuito: 'gray',
  basico: 'blue',
  profissional: 'green',
  empresarial: 'yellow',
};

// Descricoes atualizadas dos planos
const planDescriptions: Record<string, string> = {
  gratuito: 'Ideal para pequenas empresas iniciando o controle de ativos. Monitoramento basico sem custo.',
  basico: 'Para empresas em crescimento. Inclui alertas, geolocalizacao e acesso remoto aos dispositivos.',
  profissional: 'Solucao completa para empresas que precisam de relatorios, API e auditoria de seguranca.',
  empresarial: 'Plano enterprise com SSO, webhooks, white-label, suporte dedicado e SLA garantido.',
};

export function Plans() {
  const { subscription, updatePlan, refreshSubscription } = useSubscription();
  const [plans, setPlans] = useState<PlanUI[]>([]);
  const [localSubscription, setLocalSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ devices_count: 0, users_count: 0, filiais_count: 0 });
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Sincroniza subscription local com contexto
  useEffect(() => {
    if (subscription) {
      setLocalSubscription(subscription);
    }
  }, [subscription]);

  async function loadData() {
    try {
      setLoading(true);

      // Busca planos da API
      const plansData = await plansService.getPlans();

      // Adiciona campos extras do frontend (highlight para profissional)
      const plansWithUI: PlanUI[] = plansData.map(plan => ({
        ...plan,
        highlight: plan.slug === 'profissional',
        description: planDescriptions[plan.slug] || plan.description,
      }));

      setPlans(plansWithUI);

      // Busca subscription do usuario
      const subscriptionData = await plansService.getSubscription();
      setLocalSubscription(subscriptionData);

      // TODO: Buscar usage real do dashboard/analytics
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

  async function handleUpgrade(planId: number) {
    try {
      setUpgrading(planId);
      // Usa o contexto para fazer upgrade - isso vai disparar o modal automaticamente
      await updatePlan(planId);
      // Atualiza subscription local
      await refreshSubscription();
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      alert('Erro ao atualizar plano. Tente novamente.');
    } finally {
      setUpgrading(null);
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
    if (!localSubscription) return 0;
    const currentPlan = plans.find(p => p.id === localSubscription.plan_id);
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

  function getSavingsPercent(monthly: number, yearly: number): number {
    if (monthly === 0) return 0;
    const yearlyMonthly = yearly / 12;
    return Math.round(((monthly - yearlyMonthly) / monthly) * 100);
  }

  // Verifica features do plano (features JSON ou campos legados)
  function hasFeature(plan: PlanUI, feature: string): boolean {
    // Primeiro verifica no JSON features
    if (plan.features) {
      const f = plan.features;
      switch (feature) {
        case 'alerts': return f.alerts === true;
        case 'reports': return f.reports === true;
        case 'geoip': return f.geoip === true;
        case 'remote_access': return f.remote_access === true;
        case 'api_access': return f.api_access === true;
        case 'audit_logs': return f.audit_logs === true;
        case 'shadow_it': return f.shadow_it_alert === true;
        case 'webhooks': return f.webhooks === true;
        case 'sso': return f.sso_enabled === true;
        case 'white_label': return f.white_label === true;
        case 'priority_support': return f.priority_support === true;
        case 'dedicated_support': return f.dedicated_support === true;
        case 'msi_installer': return f.msi_installer === true;
        case 'sla_guarantee': return f.sla_guarantee === true;
        default: return false;
      }
    }

    // Fallback para campos legados
    switch (feature) {
      case 'alerts': return plan.feature_alerts;
      case 'reports': return plan.feature_reports;
      case 'geoip': return plan.feature_geoip;
      case 'api_access': return plan.feature_api_access;
      case 'priority_support': return plan.slug === 'profissional' || plan.slug === 'empresarial';
      default: return false;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === localSubscription?.plan_id);
  const usagePercent = getUsagePercent();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Planos e Assinatura</h1>
            <p className="page-description">Escolha o plano ideal para o seu negocio</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Plano Atual</p>
                <p className="text-2xl font-bold text-gray-900">{currentPlan?.name || '-'}</p>
              </div>
              <CreditCard className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dispositivos em Uso</p>
                <p className="text-2xl font-bold text-green-600">{usage.devices_count}</p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Limite de Dispositivos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentPlan?.max_devices === 999999 ? 'Ilimitado' : currentPlan?.max_devices || 0}
                </p>
              </div>
              <Zap className="text-gray-400" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Retencao LGPD</p>
                <p className="text-2xl font-bold text-yellow-600">{currentPlan?.data_retention_days || 0} dias</p>
              </div>
              <Shield className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan Status */}
      {subscription && currentPlan && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">Status da Assinatura</h2>
            {getStatusBadge(localSubscription!.status)}
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">Plano {currentPlan.name}</div>
                {localSubscription?.trial_ends_at && (
                  <div className="text-sm text-gray-500">
                    Teste expira em {new Date(localSubscription!.trial_ends_at!).toLocaleDateString('pt-BR')}
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
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 80 && (
                <div className="alert alert-warning mt-4">
                  <TrendingUp className="alert-icon" />
                  <span>Voce esta proximo do limite do seu plano. Considere fazer upgrade para continuar adicionando dispositivos.</span>
                </div>
              )}
            </div>

            {/* LGPD Notice */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500">
                <Shield size={12} className="inline mr-1" />
                <strong>LGPD:</strong> Seus dados de telemetria sao armazenados por {currentPlan.data_retention_days} dias.
                Apos este periodo, sao automaticamente anonimizados ou excluidos conforme a Lei Geral de Protecao de Dados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Mensal
        </span>
        <button
          type="button"
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billingPeriod === 'yearly' ? 'bg-primary' : 'bg-gray-300'}`}
          aria-label="Alternar entre cobranca mensal e anual"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
        <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Anual
        </span>
        {billingPeriod === 'yearly' && (
          <span className="badge badge-success">Economize ate 50%</span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Planos Disponiveis</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.slug] || Zap;
          const isCurrentPlan = plan.id === subscription?.plan_id;
          const colorClass = planColors[plan.slug] || 'blue';
          const savings = getSavingsPercent(plan.price_monthly_cents, plan.price_yearly_cents);
          const displayPrice = billingPeriod === 'yearly' ? Math.round(plan.price_yearly_cents / 12) : plan.price_monthly_cents;

          return (
            <div
              key={plan.id}
              className={`card relative ${plan.highlight ? 'ring-2 ring-primary' : ''} ${isCurrentPlan ? 'border-2 border-primary' : ''}`}
              style={{ marginTop: plan.highlight ? '1rem' : '0' }}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="badge badge-primary text-xs">Mais Popular</span>
                </div>
              )}

              {/* Plan Header */}
              <div className="card-header bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    colorClass === 'gray' ? 'bg-gray-100 text-gray-600' :
                    colorClass === 'blue' ? 'bg-blue-100 text-blue-600' :
                    colorClass === 'green' ? 'bg-green-100 text-green-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="badge badge-info text-xs">Atual</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="card-body border-b border-gray-100">
                {billingPeriod === 'yearly' && savings > 0 && plan.price_monthly_cents > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(plan.price_monthly_cents)}
                    </span>
                    <span className="badge badge-success text-xs">-{savings}%</span>
                  </div>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {displayPrice > 0 && (
                    <span className="text-gray-500 text-sm">/mes</span>
                  )}
                </div>
                {billingPeriod === 'yearly' && displayPrice > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(plan.price_yearly_cents)} cobrado uma vez por ano
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-3">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="card-body space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="text-green-500 flex-shrink-0" size={16} />
                  <span className="text-gray-700">
                    {plan.max_devices === 999999 ? 'Dispositivos ilimitados' : `Ate ${plan.max_devices} dispositivos`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-green-500 flex-shrink-0" size={16} />
                  <span className="text-gray-700">
                    {plan.data_retention_days} dias de retencao
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFeature(plan, 'alerts') ? (
                    <Check className="text-green-500 flex-shrink-0" size={16} />
                  ) : (
                    <X className="text-gray-300 flex-shrink-0" size={16} />
                  )}
                  <span className={hasFeature(plan, 'alerts') ? 'text-gray-700' : 'text-gray-400'}>
                    Alertas automaticos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFeature(plan, 'reports') ? (
                    <Check className="text-green-500 flex-shrink-0" size={16} />
                  ) : (
                    <X className="text-gray-300 flex-shrink-0" size={16} />
                  )}
                  <span className={hasFeature(plan, 'reports') ? 'text-gray-700' : 'text-gray-400'}>
                    Relatorios avancados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFeature(plan, 'api_access') ? (
                    <Check className="text-green-500 flex-shrink-0" size={16} />
                  ) : (
                    <X className="text-gray-300 flex-shrink-0" size={16} />
                  )}
                  <span className={hasFeature(plan, 'api_access') ? 'text-gray-700' : 'text-gray-400'}>
                    Acesso a API
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFeature(plan, 'audit_logs') ? (
                    <Check className="text-green-500 flex-shrink-0" size={16} />
                  ) : (
                    <X className="text-gray-300 flex-shrink-0" size={16} />
                  )}
                  <span className={hasFeature(plan, 'audit_logs') ? 'text-gray-700' : 'text-gray-400'}>
                    Logs de auditoria
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasFeature(plan, 'sso') ? (
                    <Check className="text-green-500 flex-shrink-0" size={16} />
                  ) : (
                    <X className="text-gray-300 flex-shrink-0" size={16} />
                  )}
                  <span className={hasFeature(plan, 'sso') ? 'text-gray-700' : 'text-gray-400'}>
                    Single Sign-On (SSO)
                  </span>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    type="button"
                    className={`btn w-full ${isCurrentPlan ? 'btn-secondary' : plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={isCurrentPlan || upgrading === plan.id}
                    onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                  >
                    {upgrading === plan.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : plan.price_monthly_cents === 0 ? (
                      'Comecar Gratis'
                    ) : (
                      'Assinar Agora'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison Table */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">Comparacao Completa de Recursos</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-left">Recurso</th>
                  {plans.map(p => (
                    <th key={p.id} className="text-center">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Limites */}
                <tr className="bg-gray-50">
                  <td colSpan={plans.length + 1} className="font-semibold text-gray-700">Limites</td>
                </tr>
                <tr>
                  <td>Dispositivos</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center font-medium">{p.max_devices === 999999 ? 'Ilimitado' : p.max_devices}</td>
                  ))}
                </tr>
                <tr>
                  <td>Usuarios</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">{p.max_users === 999 ? 'Ilimitado' : p.max_users}</td>
                  ))}
                </tr>
                <tr>
                  <td>Filiais</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">{p.max_filiais === 999 ? 'Ilimitado' : p.max_filiais}</td>
                  ))}
                </tr>
                <tr>
                  <td>Retencao de Dados (LGPD)</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">{p.data_retention_days} dias</td>
                  ))}
                </tr>

                {/* Recursos Basicos */}
                <tr className="bg-gray-50">
                  <td colSpan={plans.length + 1} className="font-semibold text-gray-700">Recursos Basicos</td>
                </tr>
                <tr>
                  <td>Alertas Automaticos</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'alerts') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Geolocalizacao por IP</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'geoip') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Acesso Remoto</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'remote_access') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Relatorios Avancados</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'reports') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>

                {/* Recursos Avancados */}
                <tr className="bg-gray-50">
                  <td colSpan={plans.length + 1} className="font-semibold text-gray-700">Recursos Avancados</td>
                </tr>
                <tr>
                  <td>Acesso a API</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'api_access') ? (
                        <span className="text-xs font-medium text-green-600">
                          {p.features?.api_access_level === 'read_write' ? 'Leitura/Escrita' : 'Leitura'}
                        </span>
                      ) : (
                        <X size={18} className="text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Logs de Auditoria</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'audit_logs') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Shadow IT (Deteccao de Software)</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'shadow_it') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Suporte Prioritario</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'priority_support') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>

                {/* Recursos Enterprise */}
                <tr className="bg-gray-50">
                  <td colSpan={plans.length + 1} className="font-semibold text-gray-700">Recursos Enterprise</td>
                </tr>
                <tr>
                  <td>Single Sign-On (SSO)</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'sso') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Webhooks</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'webhooks') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>White-Label (Personalizacao)</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'white_label') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Instalador MSI Personalizado</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'msi_installer') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Suporte Dedicado</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'dedicated_support') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>SLA Garantido</td>
                  {plans.map(p => (
                    <td key={p.id} className="text-center">
                      {hasFeature(p, 'sla_guarantee') ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="card mt-6">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Precisa de um plano personalizado?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Entre em contato para volumes maiores, integracao customizada ou necessidades especificas.
              </p>
            </div>
            <button type="button" className="btn btn-secondary">
              Falar com vendas
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">Perguntas Frequentes</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">O que acontece se eu atingir o limite de dispositivos?</h4>
            <p className="text-sm text-gray-600">
              Novos dispositivos nao poderao ser adicionados ate que voce faca upgrade do plano ou remova dispositivos existentes.
              Os dispositivos ja cadastrados continuarao funcionando normalmente.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Como funciona a retencao de dados (LGPD)?</h4>
            <p className="text-sm text-gray-600">
              Os dados de telemetria (heartbeats, eventos, logs) sao armazenados pelo periodo definido no seu plano.
              Apos esse periodo, os dados sao automaticamente anonimizados ou excluidos para conformidade com a LGPD.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Posso mudar de plano a qualquer momento?</h4>
            <p className="text-sm text-gray-600">
              Sim! Voce pode fazer upgrade ou downgrade do seu plano a qualquer momento.
              No upgrade, o valor e calculado proporcionalmente. No downgrade, o credito e aplicado no proximo ciclo.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Qual a diferenca entre plano mensal e anual?</h4>
            <p className="text-sm text-gray-600">
              O plano anual oferece ate 50% de desconto em relacao ao mensal! Por exemplo, o plano Basico
              custa R$ 99/mes no mensal, mas equivale a apenas R$ 49/mes no anual (R$ 588 cobrado uma unica vez).
              Voce paga menos e tem acesso garantido por 12 meses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
