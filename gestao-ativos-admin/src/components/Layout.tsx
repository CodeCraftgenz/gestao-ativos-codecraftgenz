import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription, type PlanFeatures } from '../contexts/SubscriptionContext';
import { UpgradeWelcomeModal } from './UpgradeWelcomeModal';
import {
  LogOut,
  Menu,
  Cpu,
  ChevronRight,
  Lock,
  Crown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { menuSections, pageNames, type NavItem } from '../config/menuConfig';

// =============================================================================
// LAYOUT COMPONENT
// =============================================================================

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

  // Filtra secoes do menu (remove secoes vazias apos filtrar items invisiveis)
  const visibleSections = useMemo(() => {
    return menuSections
      .map((section) => ({
        ...section,
        // Mantem todos os items, mas marca se estao bloqueados
        // Futuramente pode-se adicionar logica para esconder items de admin
        items: section.items,
      }))
      .filter((section) => section.items.length > 0);
  }, []);

  const currentPage = pageNames[location.pathname] || 'Dashboard';
  const userInitials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'AD';

  // Renderiza item de navegacao com Feature Guard
  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.href;
    const isLocked = item.requiredFeature && !hasFeature(item.requiredFeature as keyof PlanFeatures);

    // Se esta bloqueado, mostra com cadeado e redireciona para planos
    if (isLocked) {
      return (
        <Link
          key={item.id}
          to="/plans"
          onClick={() => setSidebarOpen(false)}
          className="sidebar-link locked"
          title={`Disponivel a partir do plano ${item.minPlan || 'superior'} - Clique para fazer upgrade`}
        >
          <item.icon size={20} />
          <span>{item.name}</span>
          <Lock size={14} className="ml-auto text-gray-400" />
        </Link>
      );
    }

    // Item normal (desbloqueado)
    return (
      <Link
        key={item.id}
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
      >
        <item.icon size={20} />
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

        {/* Navigation - Renderiza secoes dinamicamente */}
        <nav className="sidebar-nav">
          {visibleSections.map((section, index) => (
            <div key={section.title}>
              <div className={`sidebar-section-title ${index > 0 ? 'mt-6' : ''}`}>
                {section.title}
              </div>
              {section.items.map(renderNavItem)}
            </div>
          ))}
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
              type="button"
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
