-- ============================================================================
-- MIGRACAO: Gestao de Ativos -> Patio de Controle de Maquinas
-- ============================================================================
-- Data: 2025-01-15
-- Descricao: Remove tabelas de snapshot em tempo real, adiciona campos LGPD,
--            cria tabelas de historico de IP/usuario e eventos de atividade
-- ============================================================================

-- ============================================================================
-- PARTE 1: REMOVER TABELAS NAO UTILIZADAS
-- ============================================================================

-- Remove tabela de snapshots (nao sera mais utilizada)
DROP TABLE IF EXISTS device_snapshots;

-- ============================================================================
-- PARTE 2: ADICIONAR CAMPOS LGPD NA TABELA DEVICES
-- ============================================================================

-- Adiciona lgpd_consent se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'lgpd_consent');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN lgpd_consent BOOLEAN DEFAULT FALSE',
    'SELECT "Column lgpd_consent already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona lgpd_consent_at se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'lgpd_consent_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN lgpd_consent_at DATETIME NULL',
    'SELECT "Column lgpd_consent_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona data_retention_days se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'data_retention_days');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN data_retention_days INT DEFAULT 365',
    'SELECT "Column data_retention_days already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PARTE 3: ADICIONAR CAMPOS GEOIP NA TABELA HEARTBEATS
-- ============================================================================

-- Adiciona city se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'device_heartbeats' AND COLUMN_NAME = 'city');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE device_heartbeats ADD COLUMN city VARCHAR(100) NULL',
    'SELECT "Column city already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona region se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'device_heartbeats' AND COLUMN_NAME = 'region');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE device_heartbeats ADD COLUMN region VARCHAR(100) NULL',
    'SELECT "Column region already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona country se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'device_heartbeats' AND COLUMN_NAME = 'country');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE device_heartbeats ADD COLUMN country VARCHAR(10) NULL',
    'SELECT "Column country already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona isp se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'device_heartbeats' AND COLUMN_NAME = 'isp');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE device_heartbeats ADD COLUMN isp VARCHAR(255) NULL',
    'SELECT "Column isp already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PARTE 4: CRIAR TABELA DE EVENTOS DE ATIVIDADE (boot/shutdown/login/logout)
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_activity_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- Tipo do evento
  event_type ENUM('boot', 'shutdown', 'login', 'logout', 'lock', 'unlock') NOT NULL,
  occurred_at DATETIME NOT NULL,

  -- Contexto do evento
  logged_user VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  session_id VARCHAR(100) NULL,

  -- Duracao (para shutdown = tempo desde boot, para logout = duracao da sessao)
  duration_seconds BIGINT NULL,

  -- Metadados adicionais (JSON)
  details JSON NULL,

  -- Timestamp de recepcao
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indices
  INDEX idx_activity_device (device_id),
  INDEX idx_activity_type (event_type),
  INDEX idx_activity_occurred (occurred_at),
  INDEX idx_activity_device_type (device_id, event_type, occurred_at DESC),

  -- FK
  CONSTRAINT fk_activity_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 5: CRIAR TABELA DE HISTORICO DE IP
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_ip_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,

  -- GeoIP
  city VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  country VARCHAR(10) NULL,
  isp VARCHAR(255) NULL,

  -- Periodo de uso deste IP
  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,

  -- Contador de heartbeats com este IP
  heartbeat_count INT DEFAULT 1,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indices
  INDEX idx_ip_history_device (device_id),
  INDEX idx_ip_history_ip (ip_address),
  INDEX idx_ip_history_period (first_seen_at, last_seen_at),
  UNIQUE INDEX idx_ip_history_device_ip (device_id, ip_address),

  -- FK
  CONSTRAINT fk_ip_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 6: CRIAR TABELA DE HISTORICO DE USUARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_user_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,

  -- Periodo de uso
  first_login_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,

  -- Estatisticas
  total_sessions INT DEFAULT 1,
  total_time_seconds BIGINT DEFAULT 0,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indices
  INDEX idx_user_history_device (device_id),
  INDEX idx_user_history_user (username),
  UNIQUE INDEX idx_user_history_device_user (device_id, username),

  -- FK
  CONSTRAINT fk_user_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 7: CRIAR TABELA DE CONFIGURACOES LGPD
-- ============================================================================

CREATE TABLE IF NOT EXISTS lgpd_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insere configuracoes padrao de LGPD
INSERT IGNORE INTO lgpd_settings (setting_key, setting_value, description) VALUES
  ('heartbeat_retention_days', '90', 'Dias para manter heartbeats detalhados antes de anonimizar'),
  ('activity_retention_days', '365', 'Dias para manter eventos de atividade'),
  ('ip_anonymize_after_days', '180', 'Dias apos os quais IPs serao anonimizados'),
  ('user_anonymize_after_days', '730', 'Dias apos os quais usernames serao anonimizados');

-- ============================================================================
-- PARTE 8: CRIAR TABELA DE PLANOS E ASSINATURAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,

  -- Limites
  max_devices INT NOT NULL DEFAULT 5,
  max_users INT NOT NULL DEFAULT 1,
  max_filiais INT NOT NULL DEFAULT 1,

  -- Funcionalidades
  feature_alerts BOOLEAN DEFAULT FALSE,
  feature_reports BOOLEAN DEFAULT FALSE,
  feature_geoip BOOLEAN DEFAULT FALSE,
  feature_api_access BOOLEAN DEFAULT FALSE,

  -- Retencao de dados (dias)
  data_retention_days INT DEFAULT 30,

  -- Preco (em centavos para evitar problemas de ponto flutuante)
  price_monthly_cents INT DEFAULT 0,
  price_yearly_cents INT DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insere planos padrao
INSERT IGNORE INTO plans (name, slug, description, max_devices, max_users, max_filiais, feature_alerts, feature_reports, feature_geoip, feature_api_access, data_retention_days, price_monthly_cents, is_default) VALUES
  ('Básico', 'basico', 'Ideal para pequenos negócios', 5, 1, 1, FALSE, FALSE, FALSE, FALSE, 30, 0, TRUE),
  ('Profissional', 'profissional', 'Para empresas em crescimento', 20, 3, 3, TRUE, TRUE, FALSE, FALSE, 90, 9900, FALSE),
  ('Corporativo', 'corporativo', 'Solução completa para grandes empresas', 999999, 999, 999, TRUE, TRUE, TRUE, TRUE, 365, 29900, FALSE);

-- Tabela de assinaturas (vincula empresa/usuario a um plano)
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,

  -- Status da assinatura
  status ENUM('active', 'canceled', 'expired', 'trial') NOT NULL DEFAULT 'trial',

  -- Periodo
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  canceled_at DATETIME NULL,

  -- Trial
  trial_ends_at DATETIME NULL,

  -- Pagamento (referencia externa)
  external_subscription_id VARCHAR(255) NULL,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_subscription_user (user_id),
  INDEX idx_subscription_plan (plan_id),
  INDEX idx_subscription_status (status),

  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 9: CRIAR TABELA DE ALERTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- Tipo e severidade
  alert_type ENUM('disk_full', 'offline', 'cpu_high', 'ram_high', 'unauthorized_location', 'security') NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',

  -- Mensagem
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,

  -- Status
  status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
  acknowledged_at DATETIME NULL,
  acknowledged_by INT NULL,
  resolved_at DATETIME NULL,

  -- Dados do alerta
  details JSON NULL,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_alerts_device (device_id),
  INDEX idx_alerts_type (alert_type),
  INDEX idx_alerts_status (status),
  INDEX idx_alerts_created (created_at),

  CONSTRAINT fk_alerts_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 10: CONFIGURACOES DE ALERTA POR USUARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  -- Thresholds
  disk_warning_percent INT DEFAULT 80,
  disk_critical_percent INT DEFAULT 95,
  cpu_warning_percent INT DEFAULT 90,
  ram_warning_percent INT DEFAULT 90,
  offline_warning_minutes INT DEFAULT 60,
  offline_critical_minutes INT DEFAULT 1440,

  -- Notificacoes
  email_notifications BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('immediate', 'hourly', 'daily') DEFAULT 'immediate',

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_alert_settings_user (user_id),
  CONSTRAINT fk_alert_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================

SELECT 'Migracao concluida com sucesso!' AS resultado;

-- Exibe status das tabelas
SELECT
  'device_activity_events' AS tabela,
  COUNT(*) AS registros
FROM device_activity_events
UNION ALL
SELECT
  'device_ip_history' AS tabela,
  COUNT(*) AS registros
FROM device_ip_history
UNION ALL
SELECT
  'device_user_history' AS tabela,
  COUNT(*) AS registros
FROM device_user_history
UNION ALL
SELECT
  'lgpd_settings' AS tabela,
  COUNT(*) AS registros
FROM lgpd_settings;
