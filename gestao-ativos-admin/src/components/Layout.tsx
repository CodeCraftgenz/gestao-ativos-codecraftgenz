import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { UpgradeWelcomeModal } from './UpgradeWelcomeModal';
import {
  LayoutDashboard,
  Monitor,
  Clock,
  Settings,
  LogOut,
  Menu,
  Cpu,
  ChevronRight,
  PlusCircle,
  Bell,
  CreditCard,
  Shield,
  FileBarChart,
  MapPin,
  Code,
  Lock,
  Crown,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  feature?: 'alerts' | 'reports' | 'geoip' | 'apiAccess';
  badge?: string | number;
  badgeColor?: string;
}

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/devices': 'Dispositivos',
  '/register': 'Registrar Dispositivo',
  '/pending': 'Pendentes',
  '/alerts': 'Alertas',
  '/reports': 'Relatorios',
  '/geoip': 'Localizacao',
  '/api': 'API',
  '/plans': 'Planos',
  '/privacy': 'Privacidade LGPD',
  '/settings': 'Configuracoes',
};

export function Layout() {
  const { user, logout } = useAuth();
  const { plan, upgradeInfo, clearUpgradeInfo, hasFeature } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menu principal dinamico baseado nas features do plano
  const navigation = useMemo((): NavItem[] => {
    const items: NavItem[] = [
      { name: 'Painel', href: '/', icon: LayoutDashboard },
      { name: 'Dispositivos', href: '/devices', icon: Monitor },
      { name: 'Registrar', href: '/register', icon: PlusCircle },
      { name: 'Pendentes', href: '/pending', icon: Clock, badge: 0 },
    ];

    // Alertas - requer feature_alerts
    items.push({
      name: 'Alertas',
      href: '/alerts',
      icon: Bell,
      feature: 'alerts',
      badge: '!',
      badgeColor: 'bg-red-500',
    });

    // Relatorios - requer feature_reports
    items.push({
      name: 'Relatorios',
      href: '/reports',
      icon: FileBarChart,
      feature: 'reports',
    });

    // GeoIP/Localizacao - requer feature_geoip
    items.push({
      name: 'Localizacao',
      href: '/geoip',
      icon: MapPin,
      feature: 'geoip',
    });

    // API - requer feature_api_access
    items.push({
      name: 'API',
      href: '/api',
      icon: Code,
      feature: 'apiAccess',
    });

    return items;
  }, []);

  // Menu de configuracoes
  const settingsNav: NavItem[] = [
    { name: 'Planos', href: '/plans', icon: CreditCard },
    { name: 'Privacidade', href: '/privacy', icon: Shield },
    { name: 'Configuracoes', href: '/settings', icon: Settings },
  ];

  const currentPage = pageNames[location.pathname] || 'Dashboard';
  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';

  // Renderiza item de navegacao
  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.href;
    const isLocked = item.feature && !hasFeature(item.feature);

    // Se esta bloqueado, mostra com cadeado
    if (isLocked) {
      return (
        <Link
          key={item.name}
          to="/plans"
          onClick={() => setSidebarOpen(false)}
          className="sidebar-link locked"
          title={`Disponivel nos planos superiores - Clique para fazer upgrade`}
        >
          <item.icon />
          <span>{item.name}</span>
          <Lock size={14} className="ml-auto text-gray-400" />
        </Link>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
      >
        <item.icon />
        <span>{item.name}</span>
        {item.badge !== undefined && (
          <span className={`sidebar-badge ${item.badgeColor || ''}`}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Modal de upgrade */}
      {upgradeInfo && (
        <UpgradeWelcomeModal
          upgradeInfo={upgradeInfo}
          onClose={clearUpgradeInfo}
        />
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Cpu />
            </div>
            <div>
              <div className="sidebar-logo-text">Patio de Controle</div>
              <div className="sidebar-logo-subtitle">Gestao de Maquinas</div>
            </div>
          </div>
        </div>

        {/* Plan Badge */}
        {plan && (
          <div className="px-4 mb-2">
            <div className={`plan-badge plan-badge-${plan.slug}`}>
              <Crown size={14} />
              <span>{plan.name}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Principal</div>
          {navigation.map(renderNavItem)}

          <div className="sidebar-section-title mt-6">Configuracoes</div>
          {settingsNav.map(renderNavItem)}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {userInitials}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Administrador'}</div>
              <div className="sidebar-user-role">{user?.role || 'Admin'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout"
              title="Sair do sistema"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              title="Abrir menu"
            >
              <Menu size={24} />
            </button>
            <div className="topbar-breadcrumb">
              <span>Home</span>
              <ChevronRight size={16} />
              <span className="topbar-breadcrumb-current">{currentPage}</span>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-email hidden sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="topbar-logout-btn"
              title="Sair do sistema"
            >
              <LogOut size={20} />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
