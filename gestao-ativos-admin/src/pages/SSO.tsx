import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  Shield,
  Settings,
  AlertCircle,
  ExternalLink,
  Lock,
  Crown,
  TrendingUp,
  Users,
  Building2,
  X,
  Save,
} from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  logo: string;
  isConfigured: boolean;
  isActive: boolean;
  usersCount: number;
}

export default function SSO() {
  const { hasFeature, plan } = useSubscription();
  const [providers] = useState<SSOProvider[]>([
    { id: 'azure', name: 'Microsoft Azure AD', logo: '🔷', isConfigured: true, isActive: true, usersCount: 45 },
    { id: 'google', name: 'Google Workspace', logo: '🔴', isConfigured: false, isActive: false, usersCount: 0 },
    { id: 'okta', name: 'Okta', logo: '🔵', isConfigured: false, isActive: false, usersCount: 0 },
    { id: 'saml', name: 'SAML 2.0 Generico', logo: '🔐', isConfigured: false, isActive: false, usersCount: 0 },
  ]);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [settings, setSettings] = useState({
    forceSso: true,
    autoProvision: true,
    syncGroups: false,
  });

  const hasAccess = hasFeature('ssoEnabled');

  const handleConfigure = (provider: SSOProvider) => {
    setSelectedProvider(provider);
    setShowConfigModal(true);
  };

  const handleSaveSettings = () => {
    alert('Configuracoes salvas com sucesso!');
  };

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Single Sign-On (SSO)</h1>
            <p className="page-description">Autenticacao centralizada para sua organizacao</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Recurso Bloqueado
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Single Sign-On esta disponivel no plano Empresarial.
              Permita que seus usuarios acessem com as credenciais corporativas.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
              <Crown size={16} className="text-yellow-500" />
              <span>Seu plano atual: <strong>{plan?.name || 'Gratuito'}</strong></span>
            </div>
            <Link to="/plans" className="btn btn-primary">
              <TrendingUp size={16} />
              Ver Planos
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 opacity-50 pointer-events-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <Shield size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Mais Seguranca</h3>
                <p className="text-sm text-gray-500">Autenticacao centralizada</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Gestao Simplificada</h3>
                <p className="text-sm text-gray-500">Um login para tudo</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Building2 size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Enterprise Ready</h3>
                <p className="text-sm text-gray-500">Azure AD, Google, Okta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeProvider = providers.find(p => p.isActive);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Single Sign-On (SSO)</h1>
            <p className="page-description">
              Configure autenticacao centralizada para sua organizacao
            </p>
          </div>
          <div className="page-header-actions">
            <a
              href="https://docs.patio-controle.com/sso"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <ExternalLink size={16} />
              Documentacao
            </a>
          </div>
        </div>
      </div>

      {/* Status Card */}
      {activeProvider && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">SSO Ativo</h2>
                  <p className="text-gray-500 text-sm">{activeProvider.name} configurado</p>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-success">Funcionando</span>
                <p className="text-sm text-gray-500 mt-1">{activeProvider.usersCount} usuarios sincronizados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Provedores Configurados</p>
                <p className="text-2xl font-bold text-gray-900">{providers.filter(p => p.isConfigured).length}</p>
              </div>
              <KeyRound className="text-primary" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios SSO</p>
                <p className="text-2xl font-bold text-green-600">{providers.reduce((acc, p) => acc + p.usersCount, 0)}</p>
              </div>
              <Users className="text-green-500" size={24} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-2xl font-bold text-gray-900">{activeProvider ? 'Ativo' : 'Inativo'}</p>
              </div>
              <Shield className={activeProvider ? 'text-green-500' : 'text-gray-400'} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Provedores */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Provedores de Identidade</h2>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-gray-100">
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{provider.logo}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-500">
                      {provider.isConfigured
                        ? `${provider.usersCount} usuarios`
                        : 'Nao configurado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {provider.isActive && (
                    <span className="badge badge-success">Ativo</span>
                  )}
                  {provider.isConfigured && !provider.isActive && (
                    <span className="badge badge-secondary">Configurado</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleConfigure(provider)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Settings size={14} />
                    {provider.isConfigured ? 'Editar' : 'Configurar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuracoes Avancadas */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <Settings size={18} className="mr-2" />
            Configuracoes Avancadas
          </h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">Forcar SSO para todos usuarios</h3>
                <p className="text-sm text-gray-500">Desabilita login por email/senha</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.forceSso}
                  onChange={e => setSettings({ ...settings, forceSso: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <h3 className="font-medium text-gray-900">Provisionar usuarios automaticamente</h3>
                <p className="text-sm text-gray-500">Cria usuarios no primeiro login via SSO</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.autoProvision}
                  onChange={e => setSettings({ ...settings, autoProvision: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="font-medium text-gray-900">Sincronizar grupos do AD</h3>
                <p className="text-sm text-gray-500">Mapeia grupos do Azure AD para permissoes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.syncGroups}
                  onChange={e => setSettings({ ...settings, syncGroups: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={handleSaveSettings} className="btn btn-primary">
              <Save size={16} />
              Salvar Configuracoes
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Precisa de ajuda?</h4>
            <p className="text-sm text-blue-700 mt-1">
              O SSO permite que seus usuarios acessem o Patio de Controle usando as mesmas
              credenciais corporativas, aumentando a seguranca e simplificando o gerenciamento
              de acessos. Consulte nossa documentacao ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && selectedProvider && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Configurar {selectedProvider.name}
              </h3>
              <button type="button" onClick={() => setShowConfigModal(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-4">
                <AlertCircle className="alert-icon" />
                <span>
                  Configure as credenciais do seu provedor de identidade.
                  Consulte a documentacao para obter o Client ID e Secret.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Client ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Insira o Client ID"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client Secret</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Insira o Client Secret"
                />
              </div>
              {selectedProvider.id === 'azure' && (
                <div className="form-group">
                  <label className="form-label">Tenant ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Insira o Tenant ID do Azure"
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Dominio Permitido</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: suaempresa.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Apenas usuarios deste dominio poderao fazer login
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowConfigModal(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={() => setShowConfigModal(false)} className="btn btn-primary">
                Salvar Configuracao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
