import { useState } from 'react';
import { KeyRound, Shield, Settings, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  logo: string;
  isConfigured: boolean;
  isActive: boolean;
}

export default function SSO() {
  const [providers] = useState<SSOProvider[]>([
    { id: 'azure', name: 'Microsoft Azure AD', logo: '🔷', isConfigured: true, isActive: true },
    { id: 'google', name: 'Google Workspace', logo: '🔴', isConfigured: false, isActive: false },
    { id: 'okta', name: 'Okta', logo: '🔵', isConfigured: false, isActive: false },
    { id: 'saml', name: 'SAML 2.0 Generico', logo: '🔐', isConfigured: false, isActive: false },
  ]);

  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyRound className="text-primary" />
            Single Sign-On (SSO)
          </h1>
          <p className="text-gray-400 mt-1">
            Configure autenticacao centralizada para sua organizacao
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <Shield className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">SSO Ativo</h2>
              <p className="text-gray-400 text-sm">Microsoft Azure AD configurado</p>
            </div>
          </div>
          <span className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
            <CheckCircle size={16} />
            Funcionando
          </span>
        </div>
      </div>

      {/* Provedores */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Provedores de Identidade</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`bg-gray-800 rounded-lg border p-4 ${
                provider.isActive ? 'border-green-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.logo}</span>
                  <div>
                    <h3 className="font-semibold text-white">{provider.name}</h3>
                    <p className="text-sm text-gray-400">
                      {provider.isConfigured ? 'Configurado' : 'Nao configurado'}
                    </p>
                  </div>
                </div>
                {provider.isActive ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Ativo
                  </span>
                ) : (
                  <button
                    onClick={() => setShowConfig(true)}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Settings size={14} />
                    Configurar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuracoes Avancadas */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} />
          Configuracoes Avancadas
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <h3 className="text-white font-medium">Forcar SSO para todos usuarios</h3>
              <p className="text-sm text-gray-400">Desabilita login por email/senha</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-700">
            <div>
              <h3 className="text-white font-medium">Provisionar usuarios automaticamente</h3>
              <p className="text-sm text-gray-400">Cria usuarios no primeiro login via SSO</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="text-white font-medium">Sincronizar grupos do AD</h3>
              <p className="text-sm text-gray-400">Mapeia grupos do Azure AD para permissoes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          Documentacao
        </h3>
        <p className="text-gray-300 text-sm mb-3">
          O SSO permite que seus usuarios acessem o Patio de Controle usando as mesmas
          credenciais corporativas, aumentando a seguranca e simplificando o gerenciamento
          de acessos.
        </p>
        <a
          href="#"
          className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
        >
          <ExternalLink size={14} />
          Ver guia de configuracao
        </a>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Configurar Provedor SSO</h2>
            <p className="text-gray-400 mb-4">
              Funcionalidade em desenvolvimento. Entre em contato com o suporte para
              configuracao de novos provedores SSO.
            </p>
            <button
              onClick={() => setShowConfig(false)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
