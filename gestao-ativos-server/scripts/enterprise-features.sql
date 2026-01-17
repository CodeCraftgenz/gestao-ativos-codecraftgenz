-- ============================================================================
-- FEATURES ENTERPRISE - SSO, WEBHOOKS, WHITE-LABEL, API ACCESS, SHADOW IT
-- ============================================================================
-- Data: 2025-01-17
-- Objetivo: Adicionar recursos enterprise para planos Profissional e Empresarial
-- ============================================================================

-- ============================================================================
-- PARTE 1: ATUALIZAR PLANOS COM FEATURES JSON
-- (A coluna 'features' ja existe na tabela plans)
-- ============================================================================

-- Plano Gratuito
-- Features: Basico, sem recursos avancados
UPDATE plans SET
  data_retention_days = 7,
  description = 'Para pequenas empresas iniciando o controle de ativos',
  features = JSON_OBJECT(
    'max_devices', 5,
    'data_retention_days', 7,
    'reports', false,
    'api_access', false,
    'webhooks', false,
    'sso_enabled', false,
    'white_label', false,
    'priority_support', false,
    'remote_access', false,
    'audit_logs', false,
    'audit_log_export', false,
    'shadow_it_alert', false,
    'msi_installer', false,
    'geoip', false,
    'alerts', false
  )
WHERE slug = 'gratuito';

-- Plano Basico
-- Features: Relatorios basicos, acesso remoto
UPDATE plans SET
  data_retention_days = 30,
  description = 'Para empresas em crescimento com necessidades basicas',
  features = JSON_OBJECT(
    'max_devices', 20,
    'data_retention_days', 30,
    'reports', true,
    'api_access', false,
    'webhooks', false,
    'sso_enabled', false,
    'white_label', false,
    'priority_support', false,
    'remote_access', true,
    'audit_logs', false,
    'audit_log_export', false,
    'shadow_it_alert', false,
    'msi_installer', false,
    'geoip', true,
    'alerts', true
  )
WHERE slug = 'basico';

-- Plano Profissional
-- Features: API (leitura), Shadow IT, Export de logs, Suporte prioritario
UPDATE plans SET
  data_retention_days = 90,
  description = 'Para empresas que precisam de relatorios e integracao',
  features = JSON_OBJECT(
    'max_devices', 100,
    'data_retention_days', 90,
    'reports', true,
    'api_access', true,
    'api_access_level', 'read',
    'webhooks', false,
    'sso_enabled', false,
    'white_label', false,
    'priority_support', true,
    'remote_access', true,
    'audit_logs', true,
    'audit_log_export', true,
    'shadow_it_alert', true,
    'msi_installer', false,
    'geoip', true,
    'alerts', true
  )
WHERE slug = 'profissional';

-- Plano Empresarial
-- Features: TUDO liberado - SSO, API read/write, White-label, MSI, Webhooks
UPDATE plans SET
  data_retention_days = 1825,
  description = 'Para grandes empresas com compliance e auditoria',
  features = JSON_OBJECT(
    'max_devices', 999999,
    'data_retention_days', 1825,
    'reports', true,
    'api_access', true,
    'api_access_level', 'read_write',
    'webhooks', true,
    'sso_enabled', true,
    'white_label', true,
    'priority_support', true,
    'remote_access', true,
    'audit_logs', true,
    'audit_log_export', true,
    'shadow_it_alert', true,
    'msi_installer', true,
    'geoip', true,
    'alerts', true,
    'dedicated_support', true,
    'sla_guarantee', true,
    'custom_retention', true
  )
WHERE slug = 'empresarial';

-- ============================================================================
-- PARTE 2: TABELA SSO_CONFIGS (SINGLE SIGN-ON)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sso_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('azure_ad', 'google', 'okta', 'saml_generic') NOT NULL,
  client_id VARCHAR(255) NULL,
  client_secret_encrypted VARCHAR(512) NULL,
  tenant_id VARCHAR(255) NULL,
  domain VARCHAR(255) NULL,
  saml_metadata_url TEXT NULL,
  saml_entity_id VARCHAR(255) NULL,
  saml_sso_url TEXT NULL,
  saml_certificate TEXT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sso_user (user_id),
  INDEX idx_sso_provider (provider),
  CONSTRAINT fk_sso_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 3: TABELA WEBHOOK_CONFIGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  secret_key VARCHAR(255) NULL,
  events JSON NOT NULL,
  custom_headers JSON NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  last_triggered_at DATETIME NULL,
  last_status_code INT NULL,
  total_calls INT DEFAULT 0,
  total_failures INT DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_webhook_user (user_id),
  INDEX idx_webhook_enabled (is_enabled),
  CONSTRAINT fk_webhook_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de execucoes de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  webhook_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload JSON NOT NULL,
  status_code INT NULL,
  response_body TEXT NULL,
  response_time_ms INT NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhook_log_webhook (webhook_id),
  INDEX idx_webhook_log_created (created_at),
  CONSTRAINT fk_webhook_log_webhook FOREIGN KEY (webhook_id) REFERENCES webhook_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 4: TABELA ORGANIZATION_BRANDING (WHITE-LABEL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_branding (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255) NULL,
  logo_url TEXT NULL,
  logo_light_url TEXT NULL,
  favicon_url TEXT NULL,
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  accent_color VARCHAR(7) DEFAULT '#10B981',
  login_title VARCHAR(255) NULL,
  login_subtitle TEXT NULL,
  footer_text VARCHAR(255) NULL,
  custom_domain VARCHAR(255) NULL,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_branding_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 5: TABELA API_TOKENS (PARA ACESSO API)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  token_prefix VARCHAR(10) NOT NULL,
  scopes JSON NOT NULL,
  rate_limit_per_minute INT DEFAULT 60,
  last_used_at DATETIME NULL,
  total_requests INT DEFAULT 0,
  expires_at DATETIME NULL,
  revoked_at DATETIME NULL,
  revoke_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_token_user (user_id),
  INDEX idx_api_token_hash (token_hash),
  INDEX idx_api_token_prefix (token_prefix),
  CONSTRAINT fk_api_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 6: VERIFICACAO FINAL
-- ============================================================================

SELECT 'Features Enterprise adicionadas com sucesso!' AS resultado;

-- Mostrar planos atualizados
SELECT name, slug, max_devices, data_retention_days, description FROM plans ORDER BY price_monthly_cents;
