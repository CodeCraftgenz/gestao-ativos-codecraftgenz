import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Gera hash bcrypt de uma senha
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera hash SHA-256 de uma string
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Gera um token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Gera um GUID/UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Gera hash SHA-256 para tokens do agente
 * Usamos SHA-256 para tokens pois nao precisamos verificar
 * (comparamos hashes diretamente), ao contrario de senhas
 */
export function hashAgentToken(token: string): string {
  return sha256(token);
}

/**
 * Verifica se o token corresponde ao hash
 */
export function verifyAgentToken(token: string, hash: string): boolean {
  return sha256(token) === hash;
}
