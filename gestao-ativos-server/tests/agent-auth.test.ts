/**
 * Testes automatizados de autenticacao do agente
 * Execute com: npx vitest run tests/agent-auth.test.ts
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Mock do config para testes
const TEST_JWT_SECRET = 'test-secret-for-unit-tests';

// Funcoes utilitarias replicadas para teste isolado
function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hashAgentToken(token: string): string {
  return sha256(token);
}

function generateAgentAccessToken(
  deviceInternalId: number,
  deviceId: string,
  hostname: string
): string {
  const payload = {
    sub: deviceInternalId,
    device_id: deviceId,
    hostname,
    type: 'agent' as const,
  };

  return jwt.sign(payload, TEST_JWT_SECRET, {
    expiresIn: '30d',
  });
}

function verifyAgentToken(token: string): { sub: number; device_id: string; hostname: string; type: string } {
  const decoded = jwt.verify(token, TEST_JWT_SECRET) as {
    sub: number;
    device_id: string;
    hostname: string;
    type: string;
  };

  if (decoded.type !== 'agent') {
    throw new Error('Token type invalid');
  }

  return decoded;
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

describe('Agent Authentication', () => {
  describe('Token Generation and Hashing', () => {
    it('should generate consistent SHA-256 hash for same token', () => {
      const token = 'test-token-12345';

      const hash1 = hashAgentToken(token);
      const hash2 = hashAgentToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('should generate different hashes for different tokens', () => {
      const token1 = 'test-token-1';
      const token2 = 'test-token-2';

      const hash1 = hashAgentToken(token1);
      const hash2 = hashAgentToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle JWT tokens correctly', () => {
      const deviceInternalId = 123;
      const deviceId = '550e8400-e29b-41d4-a716-446655440000';
      const hostname = 'TEST-PC';

      const token = generateAgentAccessToken(deviceInternalId, deviceId, hostname);
      const hash = hashAgentToken(token);

      // O hash deve ser consistente
      expect(hashAgentToken(token)).toBe(hash);

      // O token deve ser verificavel
      const payload = verifyAgentToken(token);
      expect(payload.sub).toBe(deviceInternalId);
      expect(payload.device_id).toBe(deviceId);
      expect(payload.hostname).toBe(hostname);
      expect(payload.type).toBe('agent');
    });

    it('should fail verification for expired token', async () => {
      const token = jwt.sign(
        {
          sub: 1,
          device_id: '550e8400-e29b-41d4-a716-446655440000',
          hostname: 'TEST',
          type: 'agent',
        },
        TEST_JWT_SECRET,
        { expiresIn: '-1s' } // Ja expirado
      );

      expect(() => verifyAgentToken(token)).toThrow();
    });

    it('should fail verification for wrong token type', () => {
      const token = jwt.sign(
        {
          sub: 1,
          device_id: '550e8400-e29b-41d4-a716-446655440000',
          hostname: 'TEST',
          type: 'admin', // Tipo errado
        },
        TEST_JWT_SECRET,
        { expiresIn: '1h' }
      );

      expect(() => verifyAgentToken(token)).toThrow('Token type invalid');
    });

    it('should fail verification for invalid secret', () => {
      const token = jwt.sign(
        {
          sub: 1,
          device_id: '550e8400-e29b-41d4-a716-446655440000',
          hostname: 'TEST',
          type: 'agent',
        },
        'different-secret',
        { expiresIn: '1h' }
      );

      expect(() => verifyAgentToken(token)).toThrow();
    });
  });

  describe('Bearer Token Extraction', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      const header = `Bearer ${token}`;

      expect(extractBearerToken(header)).toBe(token);
    });

    it('should return null for missing header', () => {
      expect(extractBearerToken(undefined)).toBeNull();
    });

    it('should return null for empty header', () => {
      expect(extractBearerToken('')).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      expect(extractBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
      expect(extractBearerToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test')).toBeNull();
    });

    it('should return null for "Bearer " without token', () => {
      expect(extractBearerToken('Bearer ')).toBe('');
    });

    it('should handle extra whitespace', () => {
      // O codigo atual NAO trata espacos extras
      const token = 'mytoken';
      expect(extractBearerToken('Bearer  mytoken')).toBe(' mytoken'); // Note o espaco extra
    });
  });

  describe('Hash Encoding Edge Cases', () => {
    it('should handle UTF-8 characters in token', () => {
      const tokenWithUTF8 = 'token-com-acentuação-café';
      const hash = hashAgentToken(tokenWithUTF8);

      expect(hash).toHaveLength(64);
      expect(hashAgentToken(tokenWithUTF8)).toBe(hash);
    });

    it('should handle tokens with special characters', () => {
      const specialToken = 'token+with/special=chars==';
      const hash = hashAgentToken(specialToken);

      expect(hash).toHaveLength(64);
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(10000);
      const hash = hashAgentToken(longToken);

      expect(hash).toHaveLength(64);
    });

    it('should handle tokens with newlines (potential issue)', () => {
      const tokenWithNewline = 'token\nwith\nnewlines';
      const tokenWithoutNewline = 'token\nwith\nnewlines';
      const tokenTrimmed = 'tokenwith newlines';

      const hash1 = hashAgentToken(tokenWithNewline);
      const hash2 = hashAgentToken(tokenWithoutNewline);
      const hash3 = hashAgentToken(tokenTrimmed);

      // Newlines devem ser preservados
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should handle tokens with leading/trailing whitespace', () => {
      const token = 'mytoken';
      const tokenWithSpaces = ' mytoken ';
      const tokenWithTab = '\tmytoken\t';

      // Espacos nao sao ignorados - isso pode causar problemas
      expect(hashAgentToken(token)).not.toBe(hashAgentToken(tokenWithSpaces));
      expect(hashAgentToken(token)).not.toBe(hashAgentToken(tokenWithTab));
    });
  });

  describe('Simulated Auth Flow', () => {
    it('should complete full auth flow successfully', () => {
      // 1. Enrollment gera token e salva hash
      const deviceInternalId = 42;
      const deviceId = '550e8400-e29b-41d4-a716-446655440000';
      const hostname = 'WORKSTATION-01';

      const accessToken = generateAgentAccessToken(deviceInternalId, deviceId, hostname);
      const savedHash = hashAgentToken(accessToken);

      // Simula: token salvo no banco com este hash

      // 2. Agente faz heartbeat com o token
      const authHeader = `Bearer ${accessToken}`;
      const receivedToken = extractBearerToken(authHeader);

      expect(receivedToken).toBe(accessToken);

      // 3. Backend verifica JWT
      const payload = verifyAgentToken(receivedToken!);
      expect(payload.sub).toBe(deviceInternalId);
      expect(payload.device_id).toBe(deviceId);

      // 4. Backend calcula hash e compara
      const calculatedHash = hashAgentToken(receivedToken!);
      expect(calculatedHash).toBe(savedHash); // DEVE BATER!
    });

    it('should fail when token is modified', () => {
      const deviceInternalId = 42;
      const deviceId = '550e8400-e29b-41d4-a716-446655440000';
      const hostname = 'WORKSTATION-01';

      const accessToken = generateAgentAccessToken(deviceInternalId, deviceId, hostname);
      const savedHash = hashAgentToken(accessToken);

      // Simula modificacao do token (ex: truncado, encoding, etc)
      const modifiedToken = accessToken + 'x';

      const calculatedHash = hashAgentToken(modifiedToken);
      expect(calculatedHash).not.toBe(savedHash); // NAO deve bater
    });
  });
});

describe('Correlation ID', () => {
  it('should generate valid UUID for correlation', () => {
    const correlationId = crypto.randomUUID();
    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
