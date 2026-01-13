import { queryOne, execute } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import { hashPassword, verifyPassword } from '../../utils/hash.util.js';
import {
  generateAdminAccessToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
} from '../../utils/token.util.js';
import { User, UserRole } from '../../types/index.js';
import { UnauthorizedError, ValidationError } from '../../middleware/error.middleware.js';
import { LoginRequest, LoginResponse, RefreshTokenResponse, ChangePasswordRequest } from './auth.dto.js';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  active: boolean;
}

// =============================================================================
// LOGIN
// =============================================================================

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const user = await queryOne<UserRow>(
    `SELECT id, email, password_hash, name, role, active FROM users WHERE email = ?`,
    [data.email]
  );

  if (!user) {
    logger.warn('Tentativa de login com email inexistente', { email: data.email });
    throw new UnauthorizedError('Email ou senha invalidos');
  }

  if (!user.active) {
    logger.warn('Tentativa de login com usuario inativo', { email: data.email, userId: user.id });
    throw new UnauthorizedError('Usuario desativado. Entre em contato com o administrador.');
  }

  const passwordValid = await verifyPassword(data.password, user.password_hash);

  if (!passwordValid) {
    logger.warn('Tentativa de login com senha incorreta', { email: data.email, userId: user.id });
    throw new UnauthorizedError('Email ou senha invalidos');
  }

  // Atualiza last_login_at
  await execute(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [user.id]);

  // Gera tokens
  const accessToken = generateAdminAccessToken(user.id, user.email, user.name, user.role);
  const refreshToken = generateAdminRefreshToken(user.id, user.email, user.name, user.role);

  logger.info('Login realizado com sucesso', { userId: user.id, email: user.email });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

// =============================================================================
// REFRESH TOKEN
// =============================================================================

export async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  try {
    const payload = verifyAdminRefreshToken(token);

    // Verifica se o usuario ainda existe e esta ativo
    const user = await queryOne<UserRow>(
      `SELECT id, email, name, role, active FROM users WHERE id = ?`,
      [payload.sub]
    );

    if (!user || !user.active) {
      throw new UnauthorizedError('Usuario nao encontrado ou desativado');
    }

    // Gera novos tokens
    const accessToken = generateAdminAccessToken(user.id, user.email, user.name, user.role);
    const newRefreshToken = generateAdminRefreshToken(user.id, user.email, user.name, user.role);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Refresh token invalido ou expirado');
  }
}

// =============================================================================
// CHANGE PASSWORD
// =============================================================================

export async function changePassword(userId: number, data: ChangePasswordRequest): Promise<void> {
  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = ?`,
    [userId]
  );

  if (!user) {
    throw new ValidationError('Usuario nao encontrado');
  }

  // Verifica senha atual
  const currentPasswordValid = await verifyPassword(data.current_password, user.password_hash);

  if (!currentPasswordValid) {
    throw new ValidationError('Senha atual incorreta');
  }

  // Verifica se nova senha e diferente da atual
  const samePassword = await verifyPassword(data.new_password, user.password_hash);

  if (samePassword) {
    throw new ValidationError('Nova senha deve ser diferente da senha atual');
  }

  // Atualiza senha
  const newPasswordHash = await hashPassword(data.new_password);
  await execute(`UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`, [
    newPasswordHash,
    userId,
  ]);

  logger.info('Senha alterada com sucesso', { userId });
}

// =============================================================================
// GET CURRENT USER
// =============================================================================

export async function getCurrentUser(userId: number): Promise<Omit<UserRow, 'password_hash' | 'active'> | null> {
  const user = await queryOne<UserRow>(
    `SELECT id, email, name, role FROM users WHERE id = ? AND active = true`,
    [userId]
  );

  return user;
}
