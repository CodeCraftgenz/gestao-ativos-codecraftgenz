import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Upload,
  Trash2,
  RefreshCw,
  Sparkles,
  Monitor,
  Smartphone,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { brandingService, type OrganizationBranding, type BrandingUpdatePayload } from '../services/branding.service';

// =============================================================================
// TYPES
// =============================================================================

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

type PreviewTab = 'login' | 'dashboard';
type DevicePreview = 'desktop' | 'mobile';

// =============================================================================
// CONSTANTS
// =============================================================================

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

// Presets de cores populares
const colorPresets = [
  { name: 'Azul Corporativo', primary: '#3B82F6', secondary: '#1E40AF', accent: '#10B981' },
  { name: 'Verde Natureza', primary: '#059669', secondary: '#047857', accent: '#F59E0B' },
  { name: 'Roxo Moderno', primary: '#8B5CF6', secondary: '#6D28D9', accent: '#EC4899' },
  { name: 'Vermelho Energia', primary: '#EF4444', secondary: '#DC2626', accent: '#F97316' },
  { name: 'Cinza Elegante', primary: '#6B7280', secondary: '#4B5563', accent: '#3B82F6' },
  { name: 'Turquesa Fresh', primary: '#06B6D4', secondary: '#0891B2', accent: '#8B5CF6' },
];

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Gera cores complementares baseadas na cor primaria
function generateComplementaryColors(primary: string): { secondary: string; accent: string } {
  // Converte hex para HSL
  const hex = primary.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Gera secondary (mais escuro)
  const secondaryL = Math.max(0, l - 0.15);
  const secondary = hslToHex(h, s, secondaryL);

  // Gera accent (cor complementar)
  const accentH = (h + 0.33) % 1;
  const accent = hslToHex(accentH, Math.min(1, s + 0.1), Math.min(0.6, l + 0.1));

  return { secondary, accent };
}

function hslToHex(h: number, s: number, l: number): string {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// Skeleton Loader
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

// Toast Notification
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <X className="text-red-500" size={20} />,
    warning: <AlertCircle className="text-yellow-500" size={20} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]} animate-in slide-in-from-right duration-300`}>
      {icons[type]}
      <span className="text-gray-800">{message}</span>
      <button type="button" onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600" title="Fechar notificacao" aria-label="Fechar notificacao">
        <X size={16} />
      </button>
    </div>
  );
}

// Image Uploader com Drag & Drop
interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  type: 'logo' | 'favicon' | 'logo_light';
  hint?: string;
  previewSize?: string;
}

function ImageUploader({ label, value, onChange, type, hint, previewSize = 'h-12' }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  }, [type]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    // Valida tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens sao permitidas');
      return;
    }

    // Valida tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem deve ter no maximo 2MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Simula progresso (em producao, usar onUploadProgress do axios)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const url = await brandingService.uploadImage(file, type);

      clearInterval(progressInterval);
      setUploadProgress(100);
      onChange(url);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="py-4">
            <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
            <p className="text-sm text-gray-600">Enviando... {uploadProgress}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : value ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`bg-gray-100 rounded-lg p-2 ${previewSize}`}>
                <img
                  src={value}
                  alt={label}
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text fill="%23999" font-size="12" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Erro</text></svg>';
                  }}
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">Imagem carregada</p>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{value}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              title="Remover imagem"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <div
            className="py-6 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-600">
              Arraste uma imagem ou <span className="text-primary font-medium">clique para selecionar</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG (max. 2MB)</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label={`Upload de ${label}`}
          title={`Selecionar arquivo para ${label}`}
        />
      </div>

      {/* URL Manual Input */}
      <div className="mt-2">
        <details className="text-sm">
          <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
            Ou insira uma URL manualmente
          </summary>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="form-input mt-2 text-sm"
            placeholder="https://exemplo.com/imagem.png"
          />
        </details>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

// Color Picker Avancado
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAutoGenerate?: () => void;
  showAutoGenerate?: boolean;
}

function ColorPicker({ label, value, onChange, onAutoGenerate, showAutoGenerate }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const quickColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#06B6D4', '#6366F1', '#14B8A6', '#F97316', '#84CC16', '#A855F7',
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="form-group">
      <div className="flex items-center justify-between mb-1">
        <label className="form-label mb-0">{label}</label>
        {showAutoGenerate && onAutoGenerate && (
          <button
            type="button"
            onClick={onAutoGenerate}
            className="text-xs text-primary hover:text-primary-600 flex items-center gap-1"
          >
            <Sparkles size={12} />
            Auto-gerar
          </button>
        )}
      </div>

      <div className="relative" ref={pickerRef}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="w-12 h-10 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
            style={{ backgroundColor: value }}
            title="Abrir seletor de cores"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              value={value.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onChange(val);
                }
              }}
              className="form-input font-mono pr-10"
              placeholder="#000000"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded"
              title="Copiar cor"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Picker Dropdown */}
        {showPicker && (
          <div className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-72">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-32 rounded-lg cursor-pointer border-0"
              title={`Selecionar ${label}`}
              aria-label={`Selecionar ${label}`}
            />

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Cores rapidas</p>
              <div className="grid grid-cols-6 gap-2">
                {quickColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                      value.toUpperCase() === color ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Live Preview Component
interface LivePreviewProps {
  form: BrandingForm;
  previewTab: PreviewTab;
  devicePreview: DevicePreview;
  onPreviewTabChange: (tab: PreviewTab) => void;
  onDevicePreviewChange: (device: DevicePreview) => void;
}

function LivePreview({ form, previewTab, devicePreview, onPreviewTabChange, onDevicePreviewChange }: LivePreviewProps) {
  return (
    <div className="card sticky top-4">
      <div className="card-header flex items-center justify-between">
        <h2 className="card-title flex items-center gap-2">
          <Eye size={18} />
          Live Preview
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDevicePreviewChange('desktop')}
            className={`p-1.5 rounded ${devicePreview === 'desktop' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            title="Desktop"
          >
            <Monitor size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDevicePreviewChange('mobile')}
            className={`p-1.5 rounded ${devicePreview === 'mobile' ? 'bg-gray-200 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
            title="Mobile"
          >
            <Smartphone size={18} />
          </button>
        </div>
      </div>

      {/* Preview Tabs */}
      <div className="border-b border-gray-200 px-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => onPreviewTabChange('login')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              previewTab === 'login'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tela de Login
          </button>
          <button
            type="button"
            onClick={() => onPreviewTabChange('dashboard')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              previewTab === 'dashboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="card-body">
        <div
          className={`bg-gray-100 rounded-lg overflow-hidden border border-gray-200 transition-all ${
            devicePreview === 'mobile' ? 'max-w-[280px] mx-auto' : ''
          }`}
        >
          {previewTab === 'login' ? (
            <LoginPreview form={form} isMobile={devicePreview === 'mobile'} />
          ) : (
            <DashboardPreview form={form} isMobile={devicePreview === 'mobile'} />
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw size={12} />
          <span>Atualizando em tempo real</span>
        </div>
      </div>
    </div>
  );
}

// Login Preview
function LoginPreview({ form, isMobile }: { form: BrandingForm; isMobile: boolean }) {
  return (
    <div className="bg-white" style={{ minHeight: isMobile ? '400px' : '320px' }}>
      {/* Header com gradiente */}
      <div
        className="h-20 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${form.primaryColor} 0%, ${form.secondaryColor} 100%)`,
        }}
      >
        {form.logoUrl ? (
          <img src={form.logoUrl} alt="Logo" className="h-10 object-contain" />
        ) : (
          <div className="flex items-center gap-2 text-white">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {form.companyName?.charAt(0) || 'P'}
            </div>
            <span className="font-semibold">{form.companyName || 'Patio de Controle'}</span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className={`p-6 ${isMobile ? 'p-4' : ''}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {form.loginTitle || 'Bem-vindo'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {form.loginSubtitle || 'Faca login para continuar'}
        </p>

        {/* Mock inputs */}
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded-lg border border-gray-200" />
          <div className="h-10 bg-gray-100 rounded-lg border border-gray-200" />
          <div
            className="h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: form.primaryColor }}
          >
            Entrar
          </div>
        </div>

        {/* Footer */}
        {form.footerText && (
          <p className="text-xs text-gray-400 text-center mt-6">
            {form.footerText}
          </p>
        )}
      </div>
    </div>
  );
}

// Dashboard Preview
function DashboardPreview({ form, isMobile }: { form: BrandingForm; isMobile: boolean }) {
  return (
    <div style={{ minHeight: isMobile ? '400px' : '320px' }}>
      {/* Header */}
      <div
        className="h-10 flex items-center px-3 border-b"
        style={{ backgroundColor: form.secondaryColor }}
      >
        {form.logoUrl ? (
          <img src={form.logoUrl} alt="Logo" className="h-6 object-contain" />
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: form.primaryColor }}
            >
              {form.companyName?.charAt(0) || 'P'}
            </div>
            <span className="text-white text-sm font-medium">
              {form.companyName || 'Patio'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex h-[280px]">
        {/* Sidebar */}
        {!isMobile && (
          <div className="w-32 bg-gray-50 border-r border-gray-200 p-2 space-y-1">
            <div
              className="h-7 rounded px-2 flex items-center text-white text-xs font-medium"
              style={{ backgroundColor: form.primaryColor }}
            >
              Dashboard
            </div>
            <div className="h-7 rounded px-2 flex items-center text-gray-600 text-xs">
              Dispositivos
            </div>
            <div className="h-7 rounded px-2 flex items-center text-gray-600 text-xs">
              Alertas
            </div>
            <div className="h-7 rounded px-2 flex items-center text-gray-600 text-xs">
              Relatorios
            </div>
          </div>
        )}

        {/* Main */}
        <div className="flex-1 p-3 bg-white">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3" />

          {/* Stats Cards */}
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-3`}>
            <div
              className="h-12 rounded border p-2"
              style={{
                backgroundColor: `${form.primaryColor}10`,
                borderColor: `${form.primaryColor}30`,
              }}
            >
              <div className="h-2 w-6 rounded" style={{ backgroundColor: form.primaryColor }} />
              <div className="h-3 w-10 bg-gray-200 rounded mt-1" />
            </div>
            <div
              className="h-12 rounded border p-2"
              style={{
                backgroundColor: `${form.accentColor}10`,
                borderColor: `${form.accentColor}30`,
              }}
            >
              <div className="h-2 w-6 rounded" style={{ backgroundColor: form.accentColor }} />
              <div className="h-3 w-8 bg-gray-200 rounded mt-1" />
            </div>
            {!isMobile && (
              <div className="h-12 rounded border border-gray-200 bg-gray-50 p-2">
                <div className="h-2 w-6 bg-gray-300 rounded" />
                <div className="h-3 w-12 bg-gray-200 rounded mt-1" />
              </div>
            )}
          </div>

          {/* Table Mock */}
          <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
            <div className="h-6 bg-gray-100 border-b border-gray-200" />
            <div className="h-6 border-b border-gray-100" />
            <div className="h-6 border-b border-gray-100" />
            <div className="h-6" />
          </div>

          {/* Button */}
          <div className="mt-3 flex justify-end">
            <div
              className="h-6 w-20 rounded text-xs flex items-center justify-center text-white"
              style={{ backgroundColor: form.primaryColor }}
            >
              Acao
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Branding() {
  const { hasFeature, plan } = useSubscription();
  const [form, setForm] = useState<BrandingForm>(defaultForm);
  const [originalForm, setOriginalForm] = useState<BrandingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('login');
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('desktop');

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
      const data = await brandingService.getBranding();

      if (data) {
        const formData = apiToForm(data);
        setForm(formData);
        setOriginalForm(formData);
      }
    } catch (err) {
      console.error('Erro ao carregar branding:', err);
      setToast({ message: 'Erro ao carregar configuracoes', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const handleChange = (field: keyof BrandingForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await brandingService.updateBranding(formToApi(form));
      setOriginalForm(form);
      setToast({ message: 'Configuracoes salvas com sucesso!', type: 'success' });

      // Aplica CSS Variables se habilitado
      if (form.isEnabled) {
        applyBrandingToDocument(form);
      }
    } catch (err) {
      console.error('Erro ao salvar branding:', err);
      setToast({ message: err instanceof Error ? err.message : 'Erro ao salvar', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(originalForm);
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Tem certeza que deseja restaurar as configuracoes padrao?')) {
      return;
    }

    try {
      setIsSaving(true);
      await brandingService.deleteBranding();
      setForm(defaultForm);
      setOriginalForm(defaultForm);
      removeBrandingFromDocument();
      setToast({ message: 'Configuracoes restauradas', type: 'success' });
    } catch (err) {
      setToast({ message: 'Erro ao restaurar configuracoes', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyColorPreset = (preset: typeof colorPresets[0]) => {
    setForm(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  const handleAutoGenerateColors = () => {
    const { secondary, accent } = generateComplementaryColors(form.primaryColor);
    setForm(prev => ({
      ...prev,
      secondaryColor: secondary,
      accentColor: accent,
    }));
    setToast({ message: 'Cores complementares geradas!', type: 'success' });
  };

  // Aplica branding via CSS Variables
  const applyBrandingToDocument = (brandingForm: BrandingForm) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', brandingForm.primaryColor);
    root.style.setProperty('--color-secondary', brandingForm.secondaryColor);
    root.style.setProperty('--color-accent', brandingForm.accentColor);
  };

  const removeBrandingFromDocument = () => {
    const root = document.documentElement;
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
  };

  // Verifica se ha alteracoes nao salvas
  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(originalForm),
    [form, originalForm]
  );

  // =========================================================================
  // RENDER: Sem acesso (Upgrade)
  // =========================================================================
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

        {/* Preview desabilitado */}
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

  // =========================================================================
  // RENDER: Loading (Skeleton)
  // =========================================================================
  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">White-Label / Branding</h1>
            <p className="page-description">Personalize a aparencia do sistema com sua marca</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="card-body space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="card-body space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="card-body">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Main
  // =========================================================================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="alert alert-warning mb-6">
          <AlertCircle className="alert-icon" />
          <span>Voce tem alteracoes nao salvas.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* Identidade Visual */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Image size={18} className="mr-2" />
                Identidade Visual
              </h2>
            </div>
            <div className="card-body space-y-5">
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

              <ImageUploader
                label="Logo Principal"
                hint="Recomendado: 200x50px, fundo transparente"
                value={form.logoUrl}
                onChange={(url) => handleChange('logoUrl', url)}
                type="logo"
              />

              <ImageUploader
                label="Favicon"
                hint="Recomendado: 32x32px ou 64x64px"
                value={form.faviconUrl}
                onChange={(url) => handleChange('faviconUrl', url)}
                type="favicon"
                previewSize="h-8"
              />

              {/* Enable Toggle */}
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
                    onChange={(e) => handleChange('isEnabled', e.target.checked)}
                    aria-label="Ativar personalizacao da marca"
                    title="Ativar personalizacao da marca"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="card-title">
                <Palette size={18} className="mr-2" />
                Cores do Tema
              </h2>
            </div>
            <div className="card-body space-y-4">
              {/* Presets */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Presets de cores</p>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyColorPreset(preset)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs text-gray-700 border border-gray-200"
                      title={preset.name}
                    >
                      <div className="flex">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <div className="w-3 h-3 rounded-full -ml-1" style={{ backgroundColor: preset.secondary }} />
                        <div className="w-3 h-3 rounded-full -ml-1" style={{ backgroundColor: preset.accent }} />
                      </div>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <ColorPicker
                  label="Cor Primaria"
                  value={form.primaryColor}
                  onChange={(value) => handleChange('primaryColor', value)}
                  showAutoGenerate
                  onAutoGenerate={handleAutoGenerateColors}
                />

                <ColorPicker
                  label="Cor Secundaria"
                  value={form.secondaryColor}
                  onChange={(value) => handleChange('secondaryColor', value)}
                />

                <ColorPicker
                  label="Cor de Destaque"
                  value={form.accentColor}
                  onChange={(value) => handleChange('accentColor', value)}
                />
              </div>
            </div>
          </div>

          {/* Textos */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Textos da Tela de Login</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">Titulo</label>
                <input
                  type="text"
                  value={form.loginTitle}
                  onChange={(e) => handleChange('loginTitle', e.target.value)}
                  className="form-input"
                  placeholder="Bem-vindo ao Sistema"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitulo</label>
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
                  placeholder="© 2025 Sua Empresa"
                />
              </div>
            </div>
          </div>

          {/* Dominio */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Globe size={18} className="mr-2" />
                Dominio Personalizado
              </h2>
            </div>
            <div className="card-body">
              <p className="text-gray-600 text-sm mb-4">
                Configure um dominio personalizado para acessar o sistema
              </p>
              <div className="form-group">
                <label className="form-label">Dominio</label>
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={(e) => handleChange('customDomain', e.target.value)}
                  className="form-input"
                  placeholder="ativos.suaempresa.com"
                />
              </div>
              <div className="alert alert-warning mt-4">
                <AlertCircle className="alert-icon" />
                <span className="text-sm">
                  Configure um registro CNAME apontando para{' '}
                  <code className="bg-yellow-100 px-1 rounded">app.patiodecontrole.com.br</code>
                </span>
              </div>
            </div>
          </div>

          {/* Restaurar */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Restaurar Padrao</h3>
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

        {/* Right Column - Live Preview */}
        <div>
          <LivePreview
            form={form}
            previewTab={previewTab}
            devicePreview={devicePreview}
            onPreviewTabChange={setPreviewTab}
            onDevicePreviewChange={setDevicePreview}
          />

          {/* Email Templates */}
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="card-title">
                <Mail size={18} className="mr-2" />
                Templates de Email
              </h2>
            </div>
            <div className="card-body">
              <p className="text-gray-600 text-sm mb-4">
                Os emails utilizarao automaticamente seu logo e cores.
              </p>
              <div className="space-y-2">
                {['Email de Boas-vindas', 'Alertas de Dispositivo', 'Relatorios Periodicos'].map((template) => (
                  <div key={template} className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                    <span className="text-gray-900 font-medium text-sm">{template}</span>
                    <Check size={16} className="text-green-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Dica</h4>
            <p className="text-sm text-blue-700 mt-1">
              As alteracoes podem levar ate 5 minutos para serem refletidas.
              O dominio personalizado pode levar ate 24 horas para propagacao DNS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
