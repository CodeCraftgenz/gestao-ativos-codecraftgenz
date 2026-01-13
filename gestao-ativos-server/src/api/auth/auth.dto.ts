import { z } from 'zod';
import { UserRole } from '../../types/index.js';

// =============================================================================
// LOGIN
// =============================================================================

export const loginRequestSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha e obrigatoria'),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
}

// =============================================================================
// REFRESH TOKEN
// =============================================================================

export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token e obrigatorio'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

// =============================================================================
// CHANGE PASSWORD
// =============================================================================

export const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1, 'Senha atual e obrigatoria'),
  new_password: z
    .string()
    .min(8, 'Nova senha deve ter no minimo 8 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiuscula')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minuscula')
    .regex(/[0-9]/, 'Nova senha deve conter pelo menos um numero'),
});

export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
