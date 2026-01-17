import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole, PlanFeatureKey } from '../types/index.js';
import { extractBearerToken, verifyAdminAccessToken } from '../utils/token.util.js';
import { UnauthorizedError, ForbiddenError } from './error.middleware.js';
import { getPlanFeatures } from '../api/admin/enterprise.service.js';

/**
 * Middleware de autenticacao para rotas de admin
 * Verifica o token JWT e adiciona o usuario ao request
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedError('Token nao fornecido', 'MISSING_TOKEN');
    }

    const payload = verifyAdminAccessToken(token);

    // Adiciona o usuario ao request
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    // Erros de JWT
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        next(new UnauthorizedError('Token expirado', 'EXPIRED_TOKEN'));
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        next(new UnauthorizedError('Token invalido', 'INVALID_TOKEN'));
        return;
      }
    }

    next(new UnauthorizedError('Falha na autenticacao', 'AUTH_FAILED'));
  }
}

/**
 * Middleware de autorizacao por roles
 * Deve ser usado apos authMiddleware
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Usuario nao autenticado'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Voce nao tem permissao para esta acao'));
      return;
    }

    next();
  };
}

/**
 * Middleware que exige role ADMIN
 */
export const requireAdmin = requireRoles(UserRole.ADMIN);

/**
 * Middleware que exige role ADMIN ou OPERADOR
 */
export const requireOperator = requireRoles(UserRole.ADMIN, UserRole.OPERADOR);

/**
 * Middleware que permite qualquer role autenticado
 */
export const requireAnyRole = requireRoles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.LEITURA);

// =============================================================================
// FEATURE-BASED AUTHORIZATION
// =============================================================================

/**
 * Mapeamento de features para nomes amigaveis (para mensagens de erro)
 */
const featureDisplayNames: Partial<Record<PlanFeatureKey, string>> = {
  reports: 'Relatorios',
  alerts: 'Sistema de Alertas',
  geoip: 'Localizacao GeoIP',
  api_access: 'Acesso a API',
  audit_logs: 'Logs de Auditoria',
  audit_log_export: 'Exportacao de Logs',
  shadow_it_alert: 'Deteccao de Shadow IT',
  webhooks: 'Webhooks',
  sso_enabled: 'Single Sign-On (SSO)',
  white_label: 'Personalizacao (White-Label)',
  msi_installer: 'Instalador MSI Customizado',
  remote_access: 'Acesso Remoto',
};

/**
 * Mapeamento de features para planos minimos necessarios
 */
const featureMinPlan: Partial<Record<PlanFeatureKey, string>> = {
  reports: 'Basico',
  alerts: 'Basico',
  geoip: 'Basico',
  api_access: 'Profissional',
  audit_logs: 'Profissional',
  audit_log_export: 'Profissional',
  shadow_it_alert: 'Profissional',
  webhooks: 'Empresarial',
  sso_enabled: 'Empresarial',
  white_label: 'Empresarial',
  msi_installer: 'Empresarial',
};

/**
 * Middleware que verifica se o usuario tem acesso a uma feature especifica
 * Deve ser usado apos authMiddleware
 *
 * @param featureKey - Chave da feature a ser verificada
 * @returns Middleware function
 *
 * @example
 * router.get('/reports', authMiddleware, requireFeature('reports'), reportsController.getReports);
 * router.get('/api-tokens', authMiddleware, requireFeature('api_access'), apiController.getTokens);
 */
export function requireFeature(featureKey: PlanFeatureKey) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new UnauthorizedError('Usuario nao autenticado'));
        return;
      }

      const features = await getPlanFeatures(req.user.id);

      if (!features) {
        next(new ForbiddenError('Plano nao encontrado. Entre em contato com o suporte.'));
        return;
      }

      const featureValue = features[featureKey];

      // Verifica se a feature existe e esta habilitada
      const hasFeature = typeof featureValue === 'boolean' ? featureValue : featureValue !== undefined && featureValue !== null;

      if (!hasFeature) {
        const featureName = featureDisplayNames[featureKey] || featureKey;
        const minPlan = featureMinPlan[featureKey] || 'superior';

        next(new ForbiddenError(
          `${featureName} nao esta disponivel no seu plano. Faca upgrade para o plano ${minPlan} ou superior.`
        ));
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar feature:', error);
      next(new ForbiddenError('Erro ao verificar permissoes do plano'));
    }
  };
}

/**
 * Middleware que verifica multiplas features (AND - todas devem estar habilitadas)
 *
 * @param featureKeys - Array de chaves de features a serem verificadas
 * @returns Middleware function
 *
 * @example
 * router.get('/advanced-report', authMiddleware, requireFeatures(['reports', 'audit_log_export']), ...);
 */
export function requireFeatures(featureKeys: PlanFeatureKey[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new UnauthorizedError('Usuario nao autenticado'));
        return;
      }

      const features = await getPlanFeatures(req.user.id);

      if (!features) {
        next(new ForbiddenError('Plano nao encontrado'));
        return;
      }

      const missingFeatures: string[] = [];

      for (const key of featureKeys) {
        const featureValue = features[key];
        const hasFeature = typeof featureValue === 'boolean' ? featureValue : featureValue !== undefined;

        if (!hasFeature) {
          missingFeatures.push(featureDisplayNames[key] || key);
        }
      }

      if (missingFeatures.length > 0) {
        next(new ForbiddenError(
          `Recursos necessarios nao disponiveis: ${missingFeatures.join(', ')}. Faca upgrade do seu plano.`
        ));
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar features:', error);
      next(new ForbiddenError('Erro ao verificar permissoes do plano'));
    }
  };
}

/**
 * Middleware que verifica se o usuario tem nivel de API (read ou read_write)
 *
 * @param level - Nivel de acesso necessario ('read' ou 'read_write')
 * @returns Middleware function
 */
export function requireApiLevel(level: 'read' | 'read_write') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new UnauthorizedError('Usuario nao autenticado'));
        return;
      }

      const features = await getPlanFeatures(req.user.id);

      if (!features || !features.api_access) {
        next(new ForbiddenError('Acesso a API nao disponivel no seu plano'));
        return;
      }

      const userLevel = features.api_access_level || 'read';

      if (level === 'read_write' && userLevel !== 'read_write') {
        next(new ForbiddenError(
          'Esta acao requer nivel de API read_write. Seu plano permite apenas leitura. Faca upgrade para o plano Empresarial.'
        ));
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar nivel de API:', error);
      next(new ForbiddenError('Erro ao verificar permissoes de API'));
    }
  };
}
