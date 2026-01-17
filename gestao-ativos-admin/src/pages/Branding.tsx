import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import {
  Palette,
  Save,
  RotateCcw,
  Eye,
  Lock,
  Crown,
  TrendingUp,
  Globe,
  Mail,
  Image,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { brandingService, type OrganizationBranding, type BrandingUpdatePayload } from '../services/branding.service';

interface BrandingForm {
  companyName: string;
  logoUrl: string;
  logoLightUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  loginTitle: string;
  loginSubtitle: string;
  footerText: string;
  customDomain: string;
  isEnabled: boolean;
}

const defaultForm: BrandingForm = {
  companyName: '',
  logoUrl: '',
  logoLightUrl: '',
  faviconUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#10B981',
  loginTitle: '',
  loginSubtitle: '',
  footerText: '',
  customDomain: '',
  isEnabled: false,
};

export default function Branding() {
  const { hasFeature, plan } = useSubscription();
  const [form, setForm] = useState<BrandingForm>(defaultForm);
  const [originalForm, setOriginalForm] = useState<BrandingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const hasAccess = hasFeature('whiteLabel');

  // Converte dados da API para o formulario
  const apiToForm = (data: OrganizationBranding): BrandingForm => ({
    companyName: data.company_name || '',
    logoUrl: data.logo_url || '',
    logoLightUrl: data.logo_light_url || '',
    faviconUrl: data.favicon_url || '',
    primaryColor: data.primary_color || '#3B82F6',
    secondaryColor: data.secondary_color || '#1E40AF',
    accentColor: data.accent_color || '#10B981',
    loginTitle: data.login_title || '',
    loginSubtitle: data.login_subtitle || '',
    footerText: data.footer_text || '',
    customDomain: data.custom_domain || '',
    isEnabled: data.is_enabled || false,
  });

  // Converte formulario para payload da API
  const formToApi = (data: BrandingForm): BrandingUpdatePayload => ({
    company_name: data.companyName || undefined,
    logo_url: data.logoUrl || undefined,
    logo_light_url: data.logoLightUrl || undefined,
    favicon_url: data.faviconUrl || undefined,
    primary_color: data.primaryColor,
    secondary_color: data.secondaryColor,
    accent_color: data.accentColor,
    login_title: data.loginTitle || undefined,
    login_subtitle: data.loginSubtitle || undefined,
    footer_text: data.footerText || undefined,
    custom_domain: data.customDomain || undefined,
    is_enabled: data.isEnabled,
  });

  // Carrega dados do branding
  const loadBranding = useCallback(async () => {
    if (!hasAccess) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await brandingService.getBranding();

      if (data) {
        const formData = apiToForm(data);
        setForm(formData);
        setOriginalForm(formData);
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
      setError('Erro ao carregar configuracoes de personalizacao');
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleChange = (field: keyof BrandingForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      await brandingService.updateBranding(formToApi(form));

      setOriginalForm(form);
      setSaveSuccess(true);

      // Remove mensagem de sucesso apos 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar branding:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuracoes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(originalForm);
    setSaveSuccess(false);
    setError(null);
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configuracoes padrao? Esta acao nao pode ser desfeita.')) {
      return;
    }

    try {
      setIsSaving(true);
      await brandingService.deleteBranding();
      setForm(defaultForm);
      setOriginalForm(defaultForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao resetar branding:', err);
      setError('Erro ao restaurar configuracoes padrao');
    } finally {
      setIsSaving(false);
    }
  };

  // Verifica se ha alteracoes nao salvas
  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);

  // Se nao tem acesso, mostra tela de upgrade
  if (!hasAccess) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">White-Label / Branding</h1>
            <p className="page-description">Personalize a aparencia do sistema com sua marca</p>
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
              White-Label esta disponivel no plano Empresarial.
              Personalize completamente o sistema com sua marca e cores.
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
                <Palette size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Cores Personalizadas</h3>
                <p className="text-sm text-gray-500">Sua identidade visual</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Globe size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Dominio Proprio</h3>
                <p className="text-sm text-gray-500">app.suaempresa.com</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <Mail size={32} className="mx-auto mb-2 text-gray-400" />
                <h3 className="font-medium">Emails Customizados</h3>
                <p className="text-sm text-gray-500">Templates com sua marca</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">White-Label / Branding</h1>
            <p className="page-description">Personalize a aparencia do sistema com sua marca</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary mr-3" size={24} />
            <span className="text-gray-600">Carregando configuracoes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">White-Label / Branding</h1>
            <p className="page-description">
              Personalize a aparencia do sistema com sua marca
            </p>
          </div>
          <div className="page-header-actions">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="btn btn-secondary"
            >
              <Eye size={16} />
              {previewMode ? 'Fechar Preview' : 'Visualizar'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw size={16} />
              Desfazer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary"
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="alert alert-danger mb-6">
          <AlertCircle className="alert-icon" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto" title="Fechar" aria-label="Fechar mensagem de erro">
            <X size={16} />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="alert alert-success mb-6">
          <Check className="alert-icon" />
          <span>Configuracoes salvas com sucesso!</span>
        </div>
      )}

      {hasChanges && !saveSuccess && (
        <div className="alert alert-warning mb-6">
          <AlertCircle className="alert-icon" />
          <span>Voce tem alteracoes nao salvas.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Identidade */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Image size={18} className="mr-2" />
                Identidade Visual
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Nome da Empresa</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="form-input"
                    placeholder="Nome que aparecera no sistema"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">URL do Logo (200x50px)</label>
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    className="form-input"
                    placeholder="https://exemplo.com/logo.png"
                  />
                  {form.logoUrl && (
                    <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        className="h-12 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">URL do Favicon (32x32px)</label>
                  <input
                    type="url"
                    value={form.faviconUrl}
                    onChange={(e) => handleChange('faviconUrl', e.target.value)}
                    className="form-input"
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>

                {/* Habilitar Branding */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100">
                  <div>
                    <h3 className="font-medium text-gray-900">Ativar Personalizacao</h3>
                    <p className="text-sm text-gray-500">Aplicar estas configuracoes ao sistema</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.isEnabled}
                      onChange={e => handleChange('isEnabled', e.target.checked)}
                      aria-label="Ativar personalizacao"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Palette size={18} className="mr-2" />
                Cores do Tema
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Cor Primaria</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                      title="Selecionar cor primaria"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="form-input flex-1 font-mono"
                      placeholder="#3B82F6"
                      aria-label="Codigo hexadecimal da cor primaria"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cor Secundaria</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                      title="Selecionar cor secundaria"
                    />
                    <input
                      type="text"
                      value={form.secondaryColor}
                      onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      className="form-input flex-1 font-mono"
                      placeholder="#1E40AF"
                      aria-label="Codigo hexadecimal da cor secundaria"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cor de Destaque</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => handleChange('accentColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                      title="Selecionar cor de destaque"
                    />
                    <input
                      type="text"
                      value={form.accentColor}
                      onChange={(e) => handleChange('accentColor', e.target.value)}
                      className="form-input flex-1 font-mono"
                      placeholder="#10B981"
                      aria-label="Codigo hexadecimal da cor de destaque"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Textos Personalizados */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Textos da Tela de Login</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Titulo do Login</label>
                  <input
                    type="text"
                    value={form.loginTitle}
                    onChange={(e) => handleChange('loginTitle', e.target.value)}
                    className="form-input"
                    placeholder="Bem-vindo ao Sistema"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subtitulo do Login</label>
                  <input
                    type="text"
                    value={form.loginSubtitle}
                    onChange={(e) => handleChange('loginSubtitle', e.target.value)}
                    className="form-input"
                    placeholder="Faca login para continuar"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Texto do Rodape</label>
                  <input
                    type="text"
                    value={form.footerText}
                    onChange={(e) => handleChange('footerText', e.target.value)}
                    className="form-input"
                    placeholder="© 2025 Sua Empresa. Todos os direitos reservados."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Domain */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Preview</h2>
            </div>
            <div className="card-body">
              {/* Mini Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {/* Header Preview */}
                <div
                  className="h-12 flex items-center px-4 border-b border-gray-200"
                  style={{ backgroundColor: form.secondaryColor }}
                >
                  <div className="flex items-center gap-2">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />
                    ) : (
                      <>
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: form.primaryColor }}
                        >
                          {form.companyName?.charAt(0) || 'P'}
                        </div>
                        <span className="text-white font-semibold">
                          {form.companyName || 'Patio de Controle'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-4 h-48 bg-white">
                  <div className="flex gap-4 h-full">
                    {/* Sidebar Preview */}
                    <div className="w-40 bg-gray-50 rounded-lg p-2 space-y-2">
                      <div
                        className="h-8 rounded px-2 flex items-center text-white text-xs"
                        style={{ backgroundColor: form.primaryColor }}
                      >
                        Dashboard
                      </div>
                      <div className="h-8 rounded px-2 flex items-center text-gray-600 text-xs hover:bg-gray-100">
                        Dispositivos
                      </div>
                      <div className="h-8 rounded px-2 flex items-center text-gray-600 text-xs hover:bg-gray-100">
                        Alertas
                      </div>
                    </div>

                    {/* Main Content Preview */}
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-32 bg-gray-200 rounded"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          className="h-16 rounded border"
                          style={{ backgroundColor: `${form.primaryColor}15`, borderColor: `${form.primaryColor}30` }}
                        ></div>
                        <div
                          className="h-16 rounded border"
                          style={{ backgroundColor: `${form.accentColor}15`, borderColor: `${form.accentColor}30` }}
                        ></div>
                      </div>
                      <div className="h-20 bg-gray-100 rounded border border-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm mt-4">
                Esta e uma visualizacao simplificada. Ative a personalizacao e salve para ver as mudancas no sistema.
              </p>
            </div>
          </div>

          {/* Dominio Personalizado */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Globe size={18} className="mr-2" />
                Dominio Personalizado
              </h2>
            </div>
            <div className="card-body">
              <p className="text-gray-600 text-sm mb-4">
                Configure um dominio personalizado para acessar o sistema (ex: ativos.suaempresa.com)
              </p>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Dominio</label>
                  <input
                    type="text"
                    placeholder="ativos.suaempresa.com"
                    value={form.customDomain}
                    onChange={(e) => handleChange('customDomain', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="alert alert-warning">
                  <AlertCircle className="alert-icon" />
                  <span className="text-sm">
                    Configure um registro CNAME apontando para <code className="bg-yellow-100 px-1 rounded">app.patiodecontrole.com.br</code>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Mail size={18} className="mr-2" />
                Templates de Email
              </h2>
            </div>
            <div className="card-body">
              <p className="text-gray-600 text-sm mb-4">
                Os emails enviados pelo sistema utilizarao automaticamente seu logo e cores configurados acima.
              </p>
              <div className="space-y-2">
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">Email de Boas-vindas</span>
                  <span className="text-gray-500 text-sm block">Enviado para novos usuarios</span>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">Alertas de Dispositivo</span>
                  <span className="text-gray-500 text-sm block">Notificacoes de alertas</span>
                </div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">Relatorios Periodicos</span>
                  <span className="text-gray-500 text-sm block">Resumos semanais/mensais</span>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurar Padrao */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Restaurar Configuracoes Padrao</h3>
                  <p className="text-sm text-gray-500">Remove todas as personalizacoes</p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="btn btn-danger btn-sm"
                  disabled={isSaving}
                >
                  <RotateCcw size={14} />
                  Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Dica</h4>
            <p className="text-sm text-blue-700 mt-1">
              As alteracoes de branding podem levar ate 5 minutos para serem refletidas em todos os
              usuarios. O dominio personalizado pode levar ate 24 horas para propagacao DNS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
