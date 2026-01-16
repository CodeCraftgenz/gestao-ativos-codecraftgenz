-- ============================================================================
-- FIX: Corrigir tabela device_credentials
-- Execute este script para garantir que a estrutura esteja correta
-- ============================================================================

-- Verificar estrutura atual
-- SHOW COLUMNS FROM device_credentials;

-- Opcao 1: Se a tabela tem 'token_hash' ao inves de 'agent_token_hash'
-- Renomeia a coluna (MySQL 8.0+)
-- ALTER TABLE device_credentials RENAME COLUMN token_hash TO agent_token_hash;

-- Opcao 2: Adicionar colunas faltantes (se existirem)
-- ALTER TABLE device_credentials ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL;
-- ALTER TABLE device_credentials ADD COLUMN IF NOT EXISTS revoke_reason VARCHAR(255) NULL;
-- ALTER TABLE device_credentials ADD COLUMN IF NOT EXISTS last_used_at DATETIME NULL;

-- ============================================================================
-- SOLUCAO RECOMENDADA: Recriar a tabela com a estrutura correta
-- ============================================================================

-- Passo 1: Fazer backup (opcional)
-- CREATE TABLE device_credentials_backup AS SELECT * FROM device_credentials;

-- Passo 2: Dropar a tabela existente
DROP TABLE IF EXISTS device_credentials;

-- Passo 3: Criar com estrutura correta
CREATE TABLE device_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  agent_token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NULL,
  revoked_at DATETIME NULL,
  revoke_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME NULL,

  INDEX idx_credentials_device (device_id),
  INDEX idx_credentials_token_hash (agent_token_hash),
  INDEX idx_credentials_revoked (revoked_at),

  CONSTRAINT fk_credentials_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- IMPORTANTE: Apos executar este script, os dispositivos precisarao fazer
-- novo enrollment pois os tokens serao invalidados.
-- ============================================================================

-- Verificar resultado
-- SHOW COLUMNS FROM device_credentials;
-- SELECT * FROM device_credentials;
