import api from './api';
import type { Plan, Subscription, ApiResponse } from '../types';

export const plansService = {
  /**
   * Lista todos os planos ativos
   */
  async getPlans(): Promise<Plan[]> {
    const response = await api.get<ApiResponse<Plan[]>>('/api/admin/plans');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar planos');
    }

    return response.data.data;
  },

  /**
   * Busca plano por ID
   */
  async getPlanById(id: number): Promise<Plan> {
    const response = await api.get<ApiResponse<Plan>>(`/api/admin/plans/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar plano');
    }

    return response.data.data;
  },

  /**
   * Busca subscription do usuario logado
   */
  async getSubscription(): Promise<Subscription | null> {
    const response = await api.get<ApiResponse<Subscription>>('/api/admin/subscription');

    if (!response.data.success) {
      return null;
    }

    return response.data.data || null;
  },

  /**
   * Atualiza plano do usuario (upgrade/downgrade)
   */
  async updatePlan(planId: number): Promise<Subscription> {
    const response = await api.put<ApiResponse<Subscription>>('/api/admin/subscription', {
      plan_id: planId,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao atualizar plano');
    }

    return response.data.data;
  },

  /**
   * Cancela subscription
   */
  async cancelSubscription(): Promise<void> {
    const response = await api.delete<ApiResponse<void>>('/api/admin/subscription');

    if (!response.data.success) {
      throw new Error(response.data.error || 'Erro ao cancelar subscription');
    }
  },

  /**
   * Formata preco em centavos para reais
   */
  formatPrice(cents: number): string {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  },

  /**
   * Calcula desconto anual (20%)
   */
  getYearlyPrice(monthlyPriceCents: number): number {
    // 12 meses com 20% de desconto
    return Math.round(monthlyPriceCents * 12 * 0.8);
  },
};
