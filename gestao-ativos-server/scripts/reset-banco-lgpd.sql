-- ============================================================================
-- RESET COMPLETO DO BANCO - PATIO DE CONTROLE (LGPD COMPLIANT)
-- ============================================================================
-- Data: 2025-01-15
-- Objetivo: Estrutura minimalista focada em:
--   - Saber quando a maquina foi ligada/desligada
--   - Quem estava logado
--   - Retencao de 30 dias para dados pessoais (IP, usuario)
--   - Anonimizacao automatica apos 30 dias
-- ============================================================================

-- ATENCAO: Este script APAGA TODOS OS DADOS existentes!
-- Execute apenas se tiver certeza.

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PARTE 1: REMOVER TODAS AS TABELAS EXISTENTES
-- ============================================================================

DROP TABLE IF EXISTS command_results;
DROP TABLE IF EXISTS commands;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS device_software;
DROP TABLE IF EXISTS device_network;
DROP TABLE IF EXISTS device_disks;
DROP TABLE IF EXISTS device_hardware;
DROP TABLE IF EXISTS device_snapshots;
DROP TABLE IF EXISTS device_heartbeats;
DROP TABLE IF EXISTS device_daily_metrics;
DROP TABLE IF EXISTS device_activity_events;
DROP TABLE IF EXISTS device_ip_history;
DROP TABLE IF EXISTS device_user_history;
DROP TABLE IF EXISTS device_credentials;
DROP TABLE IF EXISTS pre_registered_devices;
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS alert_settings;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS lgpd_settings;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS filiais;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- PARTE 2: TABELAS DE USUARIOS E AUTENTICACAO
-- ============================================================================

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario admin padrao (senha: admin123 - TROCAR EM PRODUCAO!)
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@empresa.com', '$2b$10$rQZ5v5v5v5v5v5v5v5v5v.5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5', 'Administrador', 'admin');

-- ============================================================================
-- PARTE 3: FILIAIS (LOCALIZACOES/PATIOS)
-- ============================================================================

CREATE TABLE filiais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  descricao VARCHAR(255) NOT NULL,
  endereco TEXT NULL,
  cidade VARCHAR(100) NULL,
  estado VARCHAR(2) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO filiais (codigo, descricao) VALUES ('MATRIZ', 'Matriz');

-- ============================================================================
-- PARTE 4: DISPOSITIVOS (MAQUINAS)
-- ============================================================================

CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Identificacao unica
  device_id VARCHAR(100) NOT NULL UNIQUE,
  hostname VARCHAR(255) NOT NULL,
  serial_bios VARCHAR(100) NULL,
  system_uuid VARCHAR(100) NULL,
  primary_mac_address VARCHAR(17) NULL,

  -- Sistema operacional (apenas para inventario)
  os_name VARCHAR(100) NULL,
  os_version VARCHAR(50) NULL,

  -- Vinculo organizacional
  filial_id INT NULL,
  departamento VARCHAR(100) NULL,
  responsavel VARCHAR(255) NULL,

  -- Status simples
  status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
  approved_at DATETIME NULL,
  approved_by INT NULL,

  -- Ultimo sinal de vida (PRINCIPAL)
  last_seen_at DATETIME NULL,
  last_boot_at DATETIME NULL,
  last_shutdown_at DATETIME NULL,
  last_user VARCHAR(255) NULL,
  last_ip VARCHAR(45) NULL,

  -- Versao do agente
  agent_version VARCHAR(20) NULL,

  -- LGPD
  lgpd_consent BOOLEAN DEFAULT TRUE,
  data_retention_days INT DEFAULT 30,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_devices_status (status),
  INDEX idx_devices_last_seen (last_seen_at),
  INDEX idx_devices_filial (filial_id),

  CONSTRAINT fk_devices_filial FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 5: CREDENCIAIS DO AGENTE
-- ============================================================================

CREATE TABLE device_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  agent_token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NULL,
  revoked_at DATETIME NULL,
  revoke_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_credentials_device (device_id),
  CONSTRAINT fk_credentials_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 6: EVENTOS DE ATIVIDADE (PRINCIPAL - BOOT/SHUTDOWN/LOGIN)
-- ============================================================================

CREATE TABLE device_activity_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- Tipo do evento
  event_type ENUM('boot', 'shutdown', 'login', 'logout') NOT NULL,
  occurred_at DATETIME NOT NULL,

  -- Dados do evento (serao anonimizados apos 30 dias)
  logged_user VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,

  -- Duracao (para shutdown: tempo ligado, para logout: tempo da sessao)
  duration_seconds BIGINT NULL,

  -- Flag de anonimizacao
  is_anonymized BOOLEAN DEFAULT FALSE,

  -- Timestamp de recepcao
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_activity_device (device_id),
  INDEX idx_activity_type (event_type),
  INDEX idx_activity_occurred (occurred_at),
  INDEX idx_activity_anonymized (is_anonymized, occurred_at),

  CONSTRAINT fk_activity_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 7: HARDWARE BASICO (INVENTARIO PATRIMONIAL)
-- ============================================================================

CREATE TABLE device_hardware (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- CPU
  cpu_model VARCHAR(255) NULL,
  cpu_cores INT NULL,

  -- RAM
  ram_total_gb DECIMAL(10,2) NULL,

  -- Placa mae
  motherboard_manufacturer VARCHAR(255) NULL,
  motherboard_model VARCHAR(255) NULL,

  -- Disco principal
  disk_total_gb DECIMAL(10,2) NULL,
  disk_type VARCHAR(20) NULL,

  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_hardware_device (device_id),
  CONSTRAINT fk_hardware_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 8: ESTATISTICAS MENSAIS (DADOS ANONIMIZADOS AGREGADOS)
-- ============================================================================

CREATE TABLE device_monthly_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  `year_month` CHAR(7) NOT NULL,

  -- Contadores
  total_boots INT DEFAULT 0,
  total_shutdowns INT DEFAULT 0,
  total_logins INT DEFAULT 0,

  -- Tempo total ligado (segundos)
  total_uptime_seconds BIGINT DEFAULT 0,

  -- Dias com atividade
  days_with_activity INT DEFAULT 0,

  -- Usuarios unicos (apenas contagem, nao nomes)
  unique_users_count INT DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_monthly_device_month (device_id, `year_month`),
  CONSTRAINT fk_monthly_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 9: CONFIGURACOES LGPD
-- ============================================================================

CREATE TABLE lgpd_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO lgpd_settings (setting_key, setting_value, description) VALUES
  ('retention_days', '30', 'Dias para manter dados pessoais (IP, usuario) antes de anonimizar'),
  ('auto_anonymize_enabled', 'true', 'Anonimizacao automatica habilitada'),
  ('data_purpose', 'Controle patrimonial e auditoria de acesso a equipamentos da empresa', 'Finalidade da coleta de dados');

-- ============================================================================
-- PARTE 10: LOGS DE AUDITORIA (QUEM ACESSOU O SISTEMA)
-- ============================================================================

CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 11: ALERTAS SIMPLES
-- ============================================================================

CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  alert_type ENUM('offline_long', 'unauthorized_access', 'new_location') NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  status ENUM('active', 'resolved') NOT NULL DEFAULT 'active',
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_alerts_device (device_id),
  INDEX idx_alerts_status (status),

  CONSTRAINT fk_alerts_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 12: PLANOS (SIMPLIFICADO)
-- ============================================================================

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  max_devices INT NOT NULL DEFAULT 10,
  price_monthly_cents INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plans (name, slug, max_devices, price_monthly_cents) VALUES
  ('Gratuito', 'gratuito', 5, 0),
  ('Basico', 'basico', 20, 4900),
  ('Profissional', 'profissional', 100, 14900),
  ('Empresarial', 'empresarial', 999999, 49900);

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('active', 'canceled', 'expired') NOT NULL DEFAULT 'active',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,

  INDEX idx_sub_user (user_id),
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assinatura padrao para o admin
INSERT INTO subscriptions (user_id, plan_id, status) VALUES (1, 4, 'active');

-- ============================================================================
-- PARTE 13: EVENTO/PROCEDURE PARA ANONIMIZACAO AUTOMATICA (30 DIAS)
-- ============================================================================

DELIMITER //

-- Procedure para anonimizar dados antigos
CREATE PROCEDURE sp_anonymize_old_data()
BEGIN
  DECLARE retention_days INT DEFAULT 30;
  DECLARE cutoff_date DATETIME;

  -- Busca configuracao de retencao
  SELECT CAST(setting_value AS UNSIGNED) INTO retention_days
  FROM lgpd_settings WHERE setting_key = 'retention_days';

  SET cutoff_date = DATE_SUB(NOW(), INTERVAL retention_days DAY);

  -- Anonimiza eventos antigos (substitui usuario e IP por hash)
  UPDATE device_activity_events
  SET
    logged_user = CASE
      WHEN logged_user IS NOT NULL THEN CONCAT('user_', MD5(logged_user))
      ELSE NULL
    END,
    ip_address = CASE
      WHEN ip_address IS NOT NULL THEN CONCAT(SUBSTRING_INDEX(ip_address, '.', 2), '.*.* ')
      ELSE NULL
    END,
    is_anonymized = TRUE
  WHERE occurred_at < cutoff_date AND is_anonymized = FALSE;

  -- Agrega estatisticas antes de anonimizar
  INSERT INTO device_monthly_stats (device_id, `year_month`, total_boots, total_shutdowns, total_logins, days_with_activity)
  SELECT
    device_id,
    DATE_FORMAT(occurred_at, '%Y-%m') as ym,
    SUM(CASE WHEN event_type = 'boot' THEN 1 ELSE 0 END) as total_boots,
    SUM(CASE WHEN event_type = 'shutdown' THEN 1 ELSE 0 END) as total_shutdowns,
    SUM(CASE WHEN event_type = 'login' THEN 1 ELSE 0 END) as total_logins,
    COUNT(DISTINCT DATE(occurred_at)) as days_with_activity
  FROM device_activity_events
  WHERE occurred_at < cutoff_date AND is_anonymized = TRUE
  GROUP BY device_id, DATE_FORMAT(occurred_at, '%Y-%m')
  ON DUPLICATE KEY UPDATE
    total_boots = VALUES(total_boots),
    total_shutdowns = VALUES(total_shutdowns),
    total_logins = VALUES(total_logins),
    days_with_activity = VALUES(days_with_activity),
    updated_at = NOW();

  -- Remove eventos muito antigos (mais de 90 dias) ja anonimizados
  DELETE FROM device_activity_events
  WHERE occurred_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND is_anonymized = TRUE;

  -- Log da execucao
  INSERT INTO audit_logs (action, details) VALUES (
    'LGPD_ANONYMIZATION',
    JSON_OBJECT('cutoff_date', cutoff_date, 'executed_at', NOW())
  );
END //

DELIMITER ;

-- ============================================================================
-- PARTE 14: EVENTO AGENDADO PARA RODAR DIARIAMENTE
-- ============================================================================

-- Habilita o event scheduler (precisa rodar uma vez no MySQL)
-- SET GLOBAL event_scheduler = ON;

-- Cria evento para rodar a anonimizacao todo dia as 3h da manha
CREATE EVENT IF NOT EXISTS evt_daily_anonymization
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 03:00:00')
DO CALL sp_anonymize_old_data();

-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================

SELECT 'Banco resetado com sucesso!' AS resultado;
SELECT 'Estrutura LGPD compliant criada' AS status;
SELECT 'Retencao de dados: 30 dias' AS retencao;
SELECT 'Anonimizacao automatica: habilitada' AS lgpd;

-- Lista tabelas criadas
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;
