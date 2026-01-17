import api from './api';
import type { ApiResponse } from '../types';

export interface OrganizationBranding {
  id: number;
  user_id: number;
  company_name: string | null;
  logo_url: string | null;
  logo_light_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  login_title: string | null;
  login_subtitle: string | null;
  footer_text: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandingUpdatePayload {
  company_name?: string;
  logo_url?: string;
  logo_light_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  login_title?: string;
  login_subtitle?: string;
  footer_text?: string;
  custom_domain?: string;
  is_enabled?: boolean;
}

export const brandingService = {
  /**
   * Busca configuracao de branding do usuario
   */
  async getBranding(): Promise<OrganizationBranding | null> {
    try {
      const response = await api.get<ApiResponse<OrganizationBranding>>('/api/admin/branding');

      if (!response.data.success) {
        return null;
      }

      return response.data.data || null;
    } catch (error) {
      console.error('Erro ao buscar branding:', error);
      return null;
    }
  },

  /**
   * Atualiza ou cria configuracao de branding
   */
  async updateBranding(data: BrandingUpdatePayload): Promise<OrganizationBranding> {
    const response = await api.put<ApiResponse<OrganizationBranding>>('/api/admin/branding', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao salvar configuracoes de branding');
    }

    return response.data.data;
  },

  /**
   * Remove configuracao de branding (volta ao padrao)
   */
  async deleteBranding(): Promise<void> {
    const response = await api.delete<ApiResponse<void>>('/api/admin/branding');

    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao remover branding');
    }
  },

  /**
   * Faz upload de imagem (logo, favicon)
   * Retorna a URL da imagem
   */
  async uploadImage(file: File, type: 'logo' | 'favicon' | 'logo_light'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post<ApiResponse<{ url: string }>>('/api/admin/branding/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao fazer upload da imagem');
    }

    return response.data.data.url;
  },
};
