import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Subscription, Plan } from '../types';
import { plansService } from '../services/plans.service';
import { useAuth } from './AuthContext';

// Features disponiveis por plano
export interface PlanFeatures {
  alerts: boolean;
  reports: boolean;
  geoip: boolean;
  apiAccess: boolean;
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
  apiAccess: false,
  maxDevices: 5,
  maxUsers: 1,
  maxFiliais: 1,
  dataRetentionDays: 30,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Mapeia features do plano para nomes amigaveis
const featureNames: Record<string, string> = {
  feature_alerts: 'Sistema de Alertas',
  feature_reports: 'Relatorios Avancados',
  feature_geoip: 'Localizacao por GeoIP',
  feature_api_access: 'Acesso a API',
};

// Mapeia rotas para features necessarias
const routeFeatureMap: Record<string, keyof PlanFeatures> = {
  '/alerts': 'alerts',
  '/reports': 'reports',
  '/geoip': 'geoip',
  '/api': 'apiAccess',
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<PlanFeatures>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  // Extrai features do plano
  const extractFeatures = useCallback((planData: Plan): PlanFeatures => {
    return {
      alerts: planData.feature_alerts,
      reports: planData.feature_reports,
      geoip: planData.feature_geoip,
      apiAccess: planData.feature_api_access,
      maxDevices: planData.max_devices,
      maxUsers: planData.max_users,
      maxFiliais: planData.max_filiais,
      dataRetentionDays: planData.data_retention_days,
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

      const newSubscription = await plansService.updatePlan(planId);
      setSubscription(newSubscription);

      if (newSubscription?.plan) {
        const newPlan = newSubscription.plan;
        setPlan(newPlan);
        setFeatures(extractFeatures(newPlan));

        // Detecta novas features para mostrar modal
        if (previousPlan && newPlan.price_monthly_cents > previousPlan.price_monthly_cents) {
          const newFeatures: string[] = [];

          if (!previousPlan.feature_alerts && newPlan.feature_alerts) {
            newFeatures.push(featureNames.feature_alerts);
          }
          if (!previousPlan.feature_reports && newPlan.feature_reports) {
            newFeatures.push(featureNames.feature_reports);
          }
          if (!previousPlan.feature_geoip && newPlan.feature_geoip) {
            newFeatures.push(featureNames.feature_geoip);
          }
          if (!previousPlan.feature_api_access && newPlan.feature_api_access) {
            newFeatures.push(featureNames.feature_api_access);
          }

          // Adiciona limites aumentados
          if (newPlan.max_devices > previousPlan.max_devices) {
            const limit = newPlan.max_devices === 999999 ? 'Ilimitados' : `${newPlan.max_devices}`;
            newFeatures.push(`Ate ${limit} dispositivos`);
          }
          if (newPlan.data_retention_days > previousPlan.data_retention_days) {
            newFeatures.push(`${newPlan.data_retention_days} dias de retencao de dados`);
          }

          if (newFeatures.length > 0) {
            setUpgradeInfo({
              previousPlan: previousPlan.name,
              newPlan: newPlan.name,
              newFeatures,
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
  }, [plan, extractFeatures]);

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
