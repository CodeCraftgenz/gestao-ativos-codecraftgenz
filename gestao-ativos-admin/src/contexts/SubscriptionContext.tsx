import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Subscription, Plan } from '../types';
import { plansService } from '../services/plans.service';
import { useAuth } from './AuthContext';

// Features disponiveis por plano (atualizado para enterprise)
export interface PlanFeatures {
  // Features basicas
  alerts: boolean;
  reports: boolean;
  geoip: boolean;
  remoteAccess: boolean;
  auditLogs: boolean;
  // Enterprise features
  apiAccess: boolean;
  apiAccessLevel?: 'read' | 'read_write';
  webhooks: boolean;
  ssoEnabled: boolean;
  whiteLabel: boolean;
  prioritySupport: boolean;
  dedicatedSupport?: boolean;
  slaGuarantee?: boolean;
  customRetention?: boolean;
  // Limites
  maxDevices: number;
  maxUsers: number;
  maxFiliais: number;
  dataRetentionDays: number;
}

// Informacoes sobre upgrade
export interface UpgradeInfo {
  previousPlan: string;
  newPlan: string;
  newFeatures: string[];
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  plan: Plan | null;
  features: PlanFeatures;
  isLoading: boolean;
  error: string | null;
  // Funcoes
  refreshSubscription: () => Promise<void>;
  updatePlan: (planId: number) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  // Helpers
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  canAccessRoute: (route: string) => boolean;
  // Upgrade modal
  upgradeInfo: UpgradeInfo | null;
  clearUpgradeInfo: () => void;
}

const defaultFeatures: PlanFeatures = {
  alerts: false,
  reports: false,
  geoip: false,
  remoteAccess: false,
  auditLogs: false,
  apiAccess: false,
  webhooks: false,
  ssoEnabled: false,
  whiteLabel: false,
  prioritySupport: false,
  maxDevices: 5,
  maxUsers: 1,
  maxFiliais: 1,
  dataRetentionDays: 7,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Mapeia features do plano para nomes amigaveis
const featureNames: Record<string, string> = {
  alerts: 'Sistema de Alertas',
  reports: 'Relatorios Avancados',
  geoip: 'Localizacao por GeoIP',
  remoteAccess: 'Acesso Remoto',
  auditLogs: 'Logs de Auditoria',
  apiAccess: 'Acesso a API',
  webhooks: 'Webhooks para Integracao',
  ssoEnabled: 'Single Sign-On (SSO)',
  whiteLabel: 'Personalizacao (White-Label)',
  prioritySupport: 'Suporte Prioritario',
  dedicatedSupport: 'Gerente de Conta Dedicado',
  slaGuarantee: 'SLA Garantido (99.9%)',
};

// Mapeia rotas para features necessarias
const routeFeatureMap: Record<string, keyof PlanFeatures> = {
  '/alerts': 'alerts',
  '/reports': 'reports',
  '/geoip': 'geoip',
  '/api': 'apiAccess',
  '/api-access': 'apiAccess',
  '/webhooks': 'webhooks',
  '/sso': 'ssoEnabled',
  '/branding': 'whiteLabel',
  '/audit-logs': 'auditLogs',
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<PlanFeatures>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  // Extrai features do plano (suporta JSON features ou campos individuais)
  const extractFeatures = useCallback((planData: Plan): PlanFeatures => {
    // Se o plano tem campo features JSON (nova estrutura)
    if (planData.features && typeof planData.features === 'object') {
      const f = planData.features;
      return {
        alerts: f.alerts ?? planData.feature_alerts ?? false,
        reports: f.reports ?? planData.feature_reports ?? false,
        geoip: f.geoip ?? planData.feature_geoip ?? false,
        remoteAccess: f.remote_access ?? true,
        auditLogs: f.audit_logs ?? false,
        apiAccess: f.api_access ?? planData.feature_api_access ?? false,
        apiAccessLevel: f.api_access_level,
        webhooks: f.webhooks ?? false,
        ssoEnabled: f.sso_enabled ?? false,
        whiteLabel: f.white_label ?? false,
        prioritySupport: f.priority_support ?? false,
        dedicatedSupport: f.dedicated_support,
        slaGuarantee: f.sla_guarantee,
        customRetention: f.custom_retention,
        maxDevices: f.max_devices ?? planData.max_devices ?? 5,
        maxUsers: planData.max_users ?? 1,
        maxFiliais: planData.max_filiais ?? 1,
        dataRetentionDays: f.data_retention_days ?? planData.data_retention_days ?? 30,
      };
    }

    // Fallback para estrutura antiga (campos individuais)
    return {
      alerts: planData.feature_alerts ?? false,
      reports: planData.feature_reports ?? false,
      geoip: planData.feature_geoip ?? false,
      remoteAccess: true,
      auditLogs: false,
      apiAccess: planData.feature_api_access ?? false,
      webhooks: false,
      ssoEnabled: false,
      whiteLabel: false,
      prioritySupport: false,
      maxDevices: planData.max_devices ?? 5,
      maxUsers: planData.max_users ?? 1,
      maxFiliais: planData.max_filiais ?? 1,
      dataRetentionDays: planData.data_retention_days ?? 30,
    };
  }, []);

  // Carrega subscription do usuario
  const refreshSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setPlan(null);
      setFeatures(defaultFeatures);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const subscriptionData = await plansService.getSubscription();
      setSubscription(subscriptionData);

      if (subscriptionData?.plan) {
        setPlan(subscriptionData.plan);
        setFeatures(extractFeatures(subscriptionData.plan));
      } else {
        setPlan(null);
        setFeatures(defaultFeatures);
      }
    } catch (err) {
      console.error('Erro ao carregar subscription:', err);
      setError('Erro ao carregar informacoes do plano');
      setFeatures(defaultFeatures);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, extractFeatures]);

  // Carrega subscription quando usuario autentica
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription, user]);

  // Atualiza plano
  const updatePlan = useCallback(async (planId: number) => {
    try {
      setIsLoading(true);

      // Guarda plano anterior para comparacao
      const previousPlan = plan;
      const previousFeatures = features;

      const newSubscription = await plansService.updatePlan(planId);
      setSubscription(newSubscription);

      if (newSubscription?.plan) {
        const newPlan = newSubscription.plan;
        setPlan(newPlan);
        const newFeatures = extractFeatures(newPlan);
        setFeatures(newFeatures);

        // Detecta novas features para mostrar modal
        if (previousPlan && newPlan.price_monthly_cents > previousPlan.price_monthly_cents) {
          const gainedFeatures: string[] = [];

          // Verifica cada feature booleana
          const booleanFeatures: (keyof PlanFeatures)[] = [
            'alerts', 'reports', 'geoip', 'remoteAccess', 'auditLogs',
            'apiAccess', 'webhooks', 'ssoEnabled', 'whiteLabel',
            'prioritySupport', 'dedicatedSupport', 'slaGuarantee',
          ];

          booleanFeatures.forEach((key) => {
            const oldVal = previousFeatures[key];
            const newVal = newFeatures[key];
            if (!oldVal && newVal && featureNames[key]) {
              gainedFeatures.push(featureNames[key]);
            }
          });

          // Verifica upgrade de API access level
          if (newFeatures.apiAccessLevel === 'read_write' && previousFeatures.apiAccessLevel !== 'read_write') {
            gainedFeatures.push('API com acesso de Leitura e Escrita');
          }

          // Adiciona limites aumentados
          if (newFeatures.maxDevices > previousFeatures.maxDevices) {
            const limit = newFeatures.maxDevices >= 999999 ? 'Ilimitados' : `${newFeatures.maxDevices}`;
            gainedFeatures.push(`Ate ${limit} dispositivos`);
          }
          if (newFeatures.dataRetentionDays > previousFeatures.dataRetentionDays) {
            const days = newFeatures.dataRetentionDays;
            const label = days >= 365 ? `${Math.floor(days / 365)} ano(s)` : `${days} dias`;
            gainedFeatures.push(`${label} de retencao de dados`);
          }

          if (gainedFeatures.length > 0) {
            setUpgradeInfo({
              previousPlan: previousPlan.name,
              newPlan: newPlan.name,
              newFeatures: gainedFeatures,
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [plan, features, extractFeatures]);

  // Cancela subscription
  const cancelSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      await plansService.cancelSubscription();
      await refreshSubscription();
    } catch (err) {
      console.error('Erro ao cancelar subscription:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  // Verifica se tem uma feature especifica
  const hasFeature = useCallback((feature: keyof PlanFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') return value.length > 0;
    return false;
  }, [features]);

  // Verifica se pode acessar uma rota
  const canAccessRoute = useCallback((route: string): boolean => {
    const requiredFeature = routeFeatureMap[route];
    if (!requiredFeature) return true; // Rota nao requer feature especifica
    return hasFeature(requiredFeature);
  }, [hasFeature]);

  // Limpa info de upgrade (apos fechar modal)
  const clearUpgradeInfo = useCallback(() => {
    setUpgradeInfo(null);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plan,
        features,
        isLoading,
        error,
        refreshSubscription,
        updatePlan,
        cancelSubscription,
        hasFeature,
        canAccessRoute,
        upgradeInfo,
        clearUpgradeInfo,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
