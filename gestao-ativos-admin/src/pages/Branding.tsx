import { useState } from 'react';
import { Palette, Upload, Save, RotateCcw, Eye } from 'lucide-react';

interface BrandingSettings {
  companyName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  loginBackground: string;
  customCss: string;
}

export default function Branding() {
  const [settings, setSettings] = useState<BrandingSettings>({
    companyName: 'Minha Empresa',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#f59e0b',
    secondaryColor: '#1f2937',
    loginBackground: '',
    customCss: '',
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleColorChange = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    alert('Configuracoes de branding salvas! (Funcionalidade em desenvolvimento)');
  };

  const handleReset = () => {
    setSettings({
      companyName: 'Minha Empresa',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#f59e0b',
      secondaryColor: '#1f2937',
      loginBackground: '',
      customCss: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Palette className="text-primary" />
            White-Label / Branding
          </h1>
          <p className="text-gray-400 mt-1">
            Personalize a aparencia do sistema com sua marca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Eye size={18} />
            {previewMode ? 'Fechar Preview' : 'Visualizar'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            Resetar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={18} />
            Salvar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Identidade */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Identidade</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome da Empresa</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleColorChange('companyName', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Logo (recomendado: 200x50px)</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-900 border border-gray-700 border-dashed rounded-lg p-4 text-center">
                    <Upload className="mx-auto text-gray-500 mb-2" size={24} />
                    <span className="text-gray-400 text-sm">Arraste ou clique para upload</span>
                  </div>
                  {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Favicon (32x32px)</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-900 border border-gray-700 border-dashed rounded-lg p-4 text-center">
                    <Upload className="mx-auto text-gray-500 mb-2" size={24} />
                    <span className="text-gray-400 text-sm">Arraste ou clique para upload</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Cores</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cor Primaria</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Cor Secundaria</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CSS Customizado */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">CSS Personalizado</h2>
            <textarea
              value={settings.customCss}
              onChange={(e) => handleColorChange('customCss', e.target.value)}
              placeholder={`/* Adicione CSS personalizado aqui */\n.sidebar { }\n.header { }`}
              className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-primary resize-none"
            />
            <p className="text-gray-500 text-xs mt-2">
              Use com cuidado. CSS invalido pode quebrar a interface.
            </p>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>

            {/* Mini Preview */}
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
              {/* Header Preview */}
              <div
                className="h-12 flex items-center px-4 border-b border-gray-700"
                style={{ backgroundColor: settings.secondaryColor }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    {settings.companyName.charAt(0)}
                  </div>
                  <span className="text-white font-semibold">{settings.companyName}</span>
                </div>
              </div>

              {/* Content Preview */}
              <div className="p-4 h-48">
                <div className="flex gap-4 h-full">
                  {/* Sidebar Preview */}
                  <div className="w-40 bg-gray-800 rounded-lg p-2 space-y-2">
                    <div
                      className="h-8 rounded px-2 flex items-center text-white text-xs"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Dashboard
                    </div>
                    <div className="h-8 rounded px-2 flex items-center text-gray-400 text-xs hover:bg-gray-700">
                      Dispositivos
                    </div>
                    <div className="h-8 rounded px-2 flex items-center text-gray-400 text-xs hover:bg-gray-700">
                      Alertas
                    </div>
                  </div>

                  {/* Main Content Preview */}
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-32 bg-gray-700 rounded"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-gray-700 rounded"></div>
                      <div className="h-16 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-20 bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              Esta e uma visualizacao simplificada. Clique em "Visualizar" para ver
              a interface completa com suas configuracoes.
            </p>
          </div>

          {/* Dominio Personalizado */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dominio Personalizado</h2>
            <p className="text-gray-400 text-sm mb-4">
              Configure um dominio personalizado para acessar o sistema (ex: ativos.suaempresa.com)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Dominio</label>
                <input
                  type="text"
                  placeholder="ativos.suaempresa.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  Configure um registro CNAME apontando para <code className="bg-gray-900 px-1 rounded">app.patiodecontrole.com.br</code>
                </p>
              </div>
            </div>
          </div>

          {/* Email Templates */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Templates de Email</h2>
            <p className="text-gray-400 text-sm mb-4">
              Personalize os emails enviados pelo sistema com sua marca
            </p>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                <span className="text-white">Email de Boas-vindas</span>
                <span className="text-gray-500 text-sm block">Enviado para novos usuarios</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                <span className="text-white">Alertas de Dispositivo</span>
                <span className="text-gray-500 text-sm block">Notificacoes de alertas</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors">
                <span className="text-white">Relatorios Periodicos</span>
                <span className="text-gray-500 text-sm block">Resumos semanais/mensais</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
