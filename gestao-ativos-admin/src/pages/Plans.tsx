import { useState, useEffect } from 'react';
import { Check, X, Zap, Building2, CreditCard, TrendingUp, Shield, Crown, Star } from 'lucide-react';
import { plansService } from '../services/plans.service';
import type { Plan, Subscription } from '../types';

// Estende Plan com campos opcionais do frontend
interface PlanUI extends Plan {
  highlight?: boolean;
  feature_priority_support?: boolean;
  feature_custom_branding?: boolean;
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

export function Plans() {
  const [plans, setPlans] = useState<PlanUI[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats>({ devices_count: 0, users_count: 0, filiais_count: 0 });
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgrading, setUpgrading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Busca planos da API
      const plansData = await plansService.getPlans();

      // Adiciona campos extras do frontend (highlight para profissional)
      const plansWithUI: PlanUI[] = plansData.map(plan => ({
        ...plan,
        highlight: plan.slug === 'profissional',
        feature_priority_support: plan.slug === 'profissional' || plan.slug === 'empresarial',
        feature_custom_branding: plan.slug === 'empresarial',
      }));

      setPlans(plansWithUI);

      // Busca subscription do usuario
      const subscriptionData = await plansService.getSubscription();
      setSubscription(subscriptionData);

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
      const newSubscription = await plansService.updatePlan(planId);
      setSubscription(newSubscription);
      alert('Plano atualizado com sucesso!');
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

  function getSavingsPercent(monthly: number, yearly: number): number {
    if (monthly === 0) return 0;
    const yearlyMonthly = yearly / 12;
    return Math.round(((monthly - yearlyMonthly) / monthly) * 100);
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
            <p className="page-description">Escolha o plano ideal para o seu negocio</p>
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
              <Shield />
            </div>
          </div>
          <div className="stat-card-value">{currentPlan?.data_retention_days || 0}</div>
          <div className="stat-card-label">Dias de Retencao (LGPD)</div>
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
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${usagePercent >= 90 ? 'bg-danger' : usagePercent >= 70 ? 'bg-warning' : 'bg-success'}`}
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
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
          style={{ background: billingPeriod === 'yearly' ? 'var(--primary-500)' : 'var(--gray-300)' }}
          aria-label="Alternar entre cobranca mensal e anual"
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition"
            style={{ transform: billingPeriod === 'yearly' ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
          />
        </button>
        <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
          Anual
        </span>
        {billingPeriod === 'yearly' && (
          <span className="badge badge-success">Economize ate 20%</span>
        )}
      </div>

      {/* Plans Grid */}
      <div className="page-header mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Planos Disponiveis</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = planIcons[plan.slug] || Zap;
          const isCurrentPlan = plan.id === subscription?.plan_id;
          const colorClass = planColors[plan.slug] || 'blue';
          const savings = getSavingsPercent(plan.price_monthly_cents, plan.price_yearly_cents);
          const displayPrice = billingPeriod === 'yearly' ? Math.round(plan.price_yearly_cents / 12) : plan.price_monthly_cents;

          return (
            <div
              key={plan.id}
              className={`card ${plan.highlight ? 'ring-2 ring-primary-500' : ''} ${isCurrentPlan ? 'border-2 border-primary-500' : ''}`}
              style={{
                ...(plan.highlight ? { boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)' } : {}),
                position: 'relative',
                overflow: 'visible',
                marginTop: plan.highlight ? '0.75rem' : '0',
              }}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div
                  className="badge badge-primary"
                  style={{
                    position: 'absolute',
                    top: '-0.75rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.625rem',
                  }}
                >
                  Mais Popular
                </div>
              )}

              {/* Plan Header */}
              <div className="card-header" style={{ background: 'var(--gray-50)', paddingBottom: '0.75rem' }}>
                <div className="flex items-center gap-2">
                  <div className={`stat-card-icon ${colorClass}`} style={{ width: '36px', height: '36px' }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900" style={{ fontSize: '0.9375rem' }}>{plan.name}</h3>
                    {isCurrentPlan && (
                      <span className="badge badge-info" style={{ fontSize: '0.5625rem', padding: '0.0625rem 0.375rem' }}>
                        Atual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="card-body" style={{ borderBottom: '1px solid var(--gray-100)', padding: '1rem' }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(displayPrice)}
                  </span>
                  {displayPrice > 0 && (
                    <span className="text-gray-500 text-xs">/mes</span>
                  )}
                </div>
                {billingPeriod === 'yearly' && savings > 0 && (
                  <p className="text-xs text-success-600 mt-1">
                    Economize {savings}% no plano anual
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="card-body space-y-2" style={{ padding: '1rem', fontSize: '0.8125rem' }}>
                <div className="flex items-center gap-2">
                  <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  <span className="text-gray-700">
                    {plan.max_devices === 999999 ? 'Dispositivos ilimitados' : `Ate ${plan.max_devices} dispositivos`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  <span className="text-gray-700">
                    {plan.max_users === 999 ? 'Usuarios ilimitados' : `${plan.max_users} usuario${plan.max_users > 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  <span className="text-gray-700">
                    {plan.data_retention_days} dias de retencao
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_alerts ? (
                    <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  ) : (
                    <X style={{ width: '16px', height: '16px', color: 'var(--gray-300)', flexShrink: 0 }} />
                  )}
                  <span className={plan.feature_alerts ? 'text-gray-700' : 'text-gray-400'}>
                    Alertas automaticos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_reports ? (
                    <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  ) : (
                    <X style={{ width: '16px', height: '16px', color: 'var(--gray-300)', flexShrink: 0 }} />
                  )}
                  <span className={plan.feature_reports ? 'text-gray-700' : 'text-gray-400'}>
                    Relatorios avancados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_geoip ? (
                    <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  ) : (
                    <X style={{ width: '16px', height: '16px', color: 'var(--gray-300)', flexShrink: 0 }} />
                  )}
                  <span className={plan.feature_geoip ? 'text-gray-700' : 'text-gray-400'}>
                    Geolocalizacao IP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_api_access ? (
                    <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  ) : (
                    <X style={{ width: '16px', height: '16px', color: 'var(--gray-300)', flexShrink: 0 }} />
                  )}
                  <span className={plan.feature_api_access ? 'text-gray-700' : 'text-gray-400'}>
                    Acesso a API
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {plan.feature_priority_support ? (
                    <Check style={{ width: '16px', height: '16px', color: 'var(--success-500)', flexShrink: 0 }} />
                  ) : (
                    <X style={{ width: '16px', height: '16px', color: 'var(--gray-300)', flexShrink: 0 }} />
                  )}
                  <span className={plan.feature_priority_support ? 'text-gray-700' : 'text-gray-400'}>
                    Suporte prioritario
                  </span>
                </div>

                {/* Action Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    className={`btn w-full ${isCurrentPlan ? 'btn-secondary' : plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={isCurrentPlan || upgrading === plan.id}
                    onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                    style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
                  >
                    {upgrading === plan.id
                      ? 'Processando...'
                      : isCurrentPlan
                        ? 'Plano Atual'
                        : plan.price_monthly_cents === 0
                          ? 'Comecar Gratis'
                          : 'Assinar Agora'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">Comparacao de Recursos</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Recurso</th>
                {plans.map(p => (
                  <th key={p.id} className="text-center">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dispositivos</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">{p.max_devices === 999999 ? 'Ilimitado' : p.max_devices}</td>
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
              <tr>
                <td>Alertas Automaticos</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">
                    {p.feature_alerts ? <Check size={16} style={{ color: 'var(--success-500)', margin: '0 auto' }} /> : <X size={16} style={{ color: 'var(--gray-300)', margin: '0 auto' }} />}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Relatorios Avancados</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">
                    {p.feature_reports ? <Check size={16} style={{ color: 'var(--success-500)', margin: '0 auto' }} /> : <X size={16} style={{ color: 'var(--gray-300)', margin: '0 auto' }} />}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Geolocalizacao por IP</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">
                    {p.feature_geoip ? <Check size={16} style={{ color: 'var(--success-500)', margin: '0 auto' }} /> : <X size={16} style={{ color: 'var(--gray-300)', margin: '0 auto' }} />}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Acesso a API</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">
                    {p.feature_api_access ? <Check size={16} style={{ color: 'var(--success-500)', margin: '0 auto' }} /> : <X size={16} style={{ color: 'var(--gray-300)', margin: '0 auto' }} />}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Suporte Prioritario</td>
                {plans.map(p => (
                  <td key={p.id} className="text-center">
                    {p.feature_priority_support ? <Check size={16} style={{ color: 'var(--success-500)', margin: '0 auto' }} /> : <X size={16} style={{ color: 'var(--gray-300)', margin: '0 auto' }} />}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Section */}
      <div className="card mt-6">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Precisa de um plano personalizado?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Entre em contato para volumes maiores ou necessidades especificas.
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
              Os dados de telemetria (heartbeats, snapshots, eventos) sao armazenados pelo periodo definido no seu plano.
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
        </div>
      </div>
    </div>
  );
}
