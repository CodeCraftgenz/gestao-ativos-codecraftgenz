import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Painel', href: '/', icon: LayoutDashboard },
  { name: 'Dispositivos', href: '/devices', icon: Monitor },
  { name: 'Registrar', href: '/register', icon: PlusCircle },
  { name: 'Pendentes', href: '/pending', icon: Clock },
  { name: 'Alertas', href: '/alerts', icon: Bell },
];

const settingsNav = [
  { name: 'Planos', href: '/plans', icon: CreditCard },
  { name: 'Privacidade', href: '/privacy', icon: Shield },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
];

const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/devices': 'Dispositivos',
  '/register': 'Registrar Dispositivo',
  '/pending': 'Pendentes',
  '/alerts': 'Alertas',
  '/plans': 'Planos',
  '/privacy': 'Privacidade LGPD',
  '/settings': 'Configuracoes',
};

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentPage = pageNames[location.pathname] || 'Dashboard';
  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';

  return (
    <div className="min-h-screen">
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

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Principal</div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.name}</span>
                {item.name === 'Pendentes' && (
                  <span className="sidebar-badge">0</span>
                )}
                {item.name === 'Alertas' && (
                  <span className="sidebar-badge bg-red-500">!</span>
                )}
              </Link>
            );
          })}

          <div className="sidebar-section-title mt-6">Configuracoes</div>
          {settingsNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon />
                <span>{item.name}</span>
              </Link>
            );
          })}
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
            <span className="topbar-email">{user?.email}</span>
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
