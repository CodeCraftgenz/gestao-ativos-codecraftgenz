import {
  LayoutDashboard,
  Monitor,
  Clock,
  PlusCircle,
  Bell,
  FileBarChart,
  MapPin,
  Code,
  CreditCard,
  Shield,
  Settings,
  Webhook,
  KeyRound,
  Palette,
  ShieldAlert,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import type { PlanFeatures } from '../contexts/SubscriptionContext';

// =============================================================================
// MENU CONFIGURATION - Configuracao centralizada do menu lateral
// =============================================================================

/**
 * Item de navegacao do menu
 */
export interface NavItem {
  /** ID unico do item */
  id: string;
  /** Nome exibido no menu */
  name: string;
  /** Rota do item */
  href: string;
  /** Icone Lucide */
  icon: LucideIcon;
  /** Feature necessaria para acessar (se nao definida, acesso livre) */
  requiredFeature?: keyof PlanFeatures;
  /** Badge opcional (ex: contador de pendentes) */
  badge?: string | number;
  /** Cor do badge */
  badgeColor?: string;
  /** Plano minimo para desbloquear (para exibicao no tooltip) */
  minPlan?: 'Basico' | 'Profissional' | 'Empresarial';
  /** Se o item e visivel apenas para admins */
  adminOnly?: boolean;
}

/**
 * Secao do menu
 */
export interface MenuSection {
  /** Titulo da secao */
  title: string;
  /** Itens da secao */
  items: NavItem[];
}

// =============================================================================
// MENU PRINCIPAL
// =============================================================================

export const mainMenuItems: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Painel',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    id: 'devices',
    name: 'Dispositivos',
    href: '/devices',
    icon: Monitor,
  },
  {
    id: 'register',
    name: 'Registrar',
    href: '/register',
    icon: PlusCircle,
  },
  {
    id: 'pending',
    name: 'Pendentes',
    href: '/pending',
    icon: Clock,
    badge: 0,
  },
];

// =============================================================================
// RECURSOS (FEATURES) - Itens que requerem features especificas
// =============================================================================

export const featureMenuItems: NavItem[] = [
  {
    id: 'alerts',
    name: 'Alertas',
    href: '/alerts',
    icon: Bell,
    requiredFeature: 'alerts',
    minPlan: 'Basico',
    badge: '!',
    badgeColor: 'bg-red-500',
  },
  {
    id: 'reports',
    name: 'Relatorios',
    href: '/reports',
    icon: FileBarChart,
    requiredFeature: 'reports',
    minPlan: 'Basico',
  },
  {
    id: 'geoip',
    name: 'Localizacao',
    href: '/geoip',
    icon: MapPin,
    requiredFeature: 'geoip',
    minPlan: 'Basico',
  },
];

// =============================================================================
// INTEGRACOES - Itens enterprise/avancados
// =============================================================================

export const integrationMenuItems: NavItem[] = [
  {
    id: 'api',
    name: 'Integracoes & API',
    href: '/api',
    icon: Code,
    requiredFeature: 'apiAccess',
    minPlan: 'Profissional',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
    requiredFeature: 'webhooks',
    minPlan: 'Empresarial',
  },
  {
    id: 'sso',
    name: 'Single Sign-On',
    href: '/sso',
    icon: KeyRound,
    requiredFeature: 'ssoEnabled',
    minPlan: 'Empresarial',
  },
];

// =============================================================================
// SEGURANCA & AUDITORIA
// =============================================================================

export const securityMenuItems: NavItem[] = [
  {
    id: 'shadow-it',
    name: 'Seguranca & Shadow IT',
    href: '/shadow-it',
    icon: ShieldAlert,
    requiredFeature: 'shadowItAlert',
    minPlan: 'Profissional',
  },
  {
    id: 'audit-logs',
    name: 'Auditoria & Logs',
    href: '/audit-logs',
    icon: FileText,
    requiredFeature: 'auditLogExport',
    minPlan: 'Profissional',
  },
];

// =============================================================================
// PERSONALIZACAO (ENTERPRISE)
// =============================================================================

export const customizationMenuItems: NavItem[] = [
  {
    id: 'branding',
    name: 'White-Label',
    href: '/branding',
    icon: Palette,
    requiredFeature: 'whiteLabel',
    minPlan: 'Empresarial',
  },
];

// =============================================================================
// CONFIGURACOES (SEMPRE VISIVEL)
// =============================================================================

export const settingsMenuItems: NavItem[] = [
  {
    id: 'plans',
    name: 'Planos',
    href: '/plans',
    icon: CreditCard,
  },
  {
    id: 'privacy',
    name: 'Privacidade',
    href: '/privacy',
    icon: Shield,
  },
  {
    id: 'settings',
    name: 'Configuracoes',
    href: '/settings',
    icon: Settings,
  },
];

// =============================================================================
// MENU COMPLETO EM SECOES
// =============================================================================

export const menuSections: MenuSection[] = [
  {
    title: 'Menu Principal',
    items: mainMenuItems,
  },
  {
    title: 'Recursos',
    items: featureMenuItems,
  },
  {
    title: 'Integracoes',
    items: integrationMenuItems,
  },
  {
    title: 'Seguranca',
    items: securityMenuItems,
  },
  {
    title: 'Personalizacao',
    items: customizationMenuItems,
  },
  {
    title: 'Configuracoes',
    items: settingsMenuItems,
  },
];

// =============================================================================
// MAPEAMENTO DE ROTAS PARA NOMES DE PAGINAS
// =============================================================================

export const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/devices': 'Dispositivos',
  '/register': 'Registrar Dispositivo',
  '/pending': 'Pendentes',
  '/alerts': 'Alertas',
  '/reports': 'Relatorios',
  '/geoip': 'Localizacao',
  '/api': 'Integracoes & API',
  '/webhooks': 'Webhooks',
  '/sso': 'Single Sign-On',
  '/shadow-it': 'Seguranca & Shadow IT',
  '/audit-logs': 'Auditoria & Logs',
  '/branding': 'White-Label',
  '/plans': 'Planos',
  '/privacy': 'Privacidade LGPD',
  '/settings': 'Configuracoes',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Retorna todos os itens de menu em uma lista plana
 */
export function getAllMenuItems(): NavItem[] {
  return menuSections.flatMap((section) => section.items);
}

/**
 * Encontra um item de menu pelo href
 */
export function findMenuItemByHref(href: string): NavItem | undefined {
  return getAllMenuItems().find((item) => item.href === href);
}

/**
 * Verifica se uma rota requer feature
 */
export function routeRequiresFeature(href: string): keyof PlanFeatures | undefined {
  const item = findMenuItemByHref(href);
  return item?.requiredFeature;
}
