-- ============================================================================
-- SETUP COMPLETO: Patio de Controle de Maquinas
-- ============================================================================
-- Execute este script no banco de producao para criar todas as tabelas
-- necessarias para o funcionamento do sistema.
-- ============================================================================

-- ============================================================================
-- TABELAS BASE
-- ============================================================================

-- Tabela de usuarios (se nao existir)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'viewer') NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de filiais
CREATE TABLE IF NOT EXISTS filiais (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(50) NULL,
  country VARCHAR(50) DEFAULT 'Brasil',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_filiais_name (name),
  INDEX idx_filiais_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir filial padrao se nao existir
INSERT IGNORE INTO filiais (id, name, code) VALUES (1, 'Matriz', 'MTZ');

-- Tabela de dispositivos
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_tag VARCHAR(100) NOT NULL UNIQUE,
  hostname VARCHAR(255) NULL,

  -- Status
  status ENUM('pending', 'approved', 'blocked', 'offline') NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at DATETIME NULL,

  -- Atribuicao
  assigned_user VARCHAR(255) NULL,
  filial_id INT NULL,

  -- Sistema
  os_name VARCHAR(100) NULL,
  os_version VARCHAR(100) NULL,
  os_build VARCHAR(50) NULL,

  -- Credenciais do agente
  agent_token VARCHAR(500) NULL,
  agent_version VARCHAR(50) NULL,

  -- Campos LGPD
  lgpd_consent BOOLEAN DEFAULT FALSE,
  lgpd_consent_at DATETIME NULL,
  data_retention_days INT DEFAULT 365,

  -- Timestamps
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_devices_service_tag (service_tag),
  INDEX idx_devices_hostname (hostname),
  INDEX idx_devices_status (status),
  INDEX idx_devices_last_seen (last_seen_at),
  INDEX idx_devices_filial (filial_id),

  CONSTRAINT fk_devices_filial FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de credenciais do dispositivo
CREATE TABLE IF NOT EXISTS device_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  last_used_at DATETIME NULL,

  CONSTRAINT fk_device_credentials_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE INVENTARIO
-- ============================================================================

-- Hardware do dispositivo
CREATE TABLE IF NOT EXISTS device_hardware (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,

  -- CPU
  cpu_name VARCHAR(255) NULL,
  cpu_cores INT NULL,
  cpu_threads INT NULL,
  cpu_max_speed_mhz INT NULL,

  -- Memoria
  ram_total_mb BIGINT NULL,
  ram_type VARCHAR(50) NULL,

  -- Placa-mae
  motherboard_manufacturer VARCHAR(255) NULL,
  motherboard_product VARCHAR(255) NULL,

  -- BIOS
  bios_manufacturer VARCHAR(255) NULL,
  bios_version VARCHAR(100) NULL,
  bios_date VARCHAR(50) NULL,

  -- GPU
  gpu_name VARCHAR(255) NULL,
  gpu_memory_mb INT NULL,

  -- Timestamps
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_device_hardware_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Discos do dispositivo
CREATE TABLE IF NOT EXISTS device_disks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  drive_letter VARCHAR(10) NULL,
  volume_label VARCHAR(100) NULL,
  filesystem VARCHAR(50) NULL,
  total_gb DECIMAL(10,2) NULL,
  free_gb DECIMAL(10,2) NULL,
  used_percent DECIMAL(5,2) NULL,
  serial_number VARCHAR(100) NULL,
  model VARCHAR(255) NULL,

  -- Tipo de disco
  disk_type ENUM('HDD', 'SSD', 'NVMe', 'Unknown') DEFAULT 'Unknown',

  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_device_disks_device (device_id),
  CONSTRAINT fk_device_disks_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rede do dispositivo
CREATE TABLE IF NOT EXISTS device_network (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  adapter_name VARCHAR(255) NULL,
  mac_address VARCHAR(17) NULL,
  ip_address VARCHAR(45) NULL,
  subnet_mask VARCHAR(45) NULL,
  gateway VARCHAR(45) NULL,
  dns_servers TEXT NULL,

  is_wifi BOOLEAN DEFAULT FALSE,
  wifi_ssid VARCHAR(100) NULL,

  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_device_network_device (device_id),
  INDEX idx_device_network_mac (mac_address),
  CONSTRAINT fk_device_network_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Software instalado
CREATE TABLE IF NOT EXISTS device_software (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  name VARCHAR(255) NOT NULL,
  version VARCHAR(100) NULL,
  publisher VARCHAR(255) NULL,
  install_date DATE NULL,
  install_location TEXT NULL,

  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_device_software_device (device_id),
  INDEX idx_device_software_name (name),
  CONSTRAINT fk_device_software_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE TELEMETRIA
-- ============================================================================

-- Heartbeats (telemetria periodica)
CREATE TABLE IF NOT EXISTS device_heartbeats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- Metricas
  cpu_percent FLOAT NULL,
  ram_percent FLOAT NULL,
  ram_used_mb BIGINT NULL,
  ram_total_mb BIGINT NULL,

  -- Disco principal
  disk_percent FLOAT NULL,
  disk_used_mb BIGINT NULL,
  disk_total_mb BIGINT NULL,

  -- Rede
  ip_address VARCHAR(45) NULL,

  -- Usuario logado
  logged_user VARCHAR(255) NULL,

  -- Uptime
  uptime_seconds BIGINT NULL,

  -- GeoIP (opcional)
  city VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  country VARCHAR(10) NULL,
  isp VARCHAR(255) NULL,

  -- Timestamps
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_heartbeats_device (device_id),
  INDEX idx_heartbeats_received (received_at),
  INDEX idx_heartbeats_device_received (device_id, received_at DESC),

  CONSTRAINT fk_heartbeats_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE COMANDOS
-- ============================================================================

-- Comandos enviados para dispositivos
CREATE TABLE IF NOT EXISTS commands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  command_type VARCHAR(50) NOT NULL,
  payload JSON NULL,

  status ENUM('pending', 'sent', 'executed', 'failed', 'expired') NOT NULL DEFAULT 'pending',

  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  executed_at DATETIME NULL,
  expires_at DATETIME NULL,

  INDEX idx_commands_device (device_id),
  INDEX idx_commands_status (status),

  CONSTRAINT fk_commands_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resultados de comandos
CREATE TABLE IF NOT EXISTS command_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_id INT NOT NULL,

  success BOOLEAN NOT NULL,
  output TEXT NULL,
  error TEXT NULL,

  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_command_results_command FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DO PATIO DE CONTROLE
-- ============================================================================

-- Eventos de atividade (boot/shutdown/login/logout)
CREATE TABLE IF NOT EXISTS device_activity_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  event_type ENUM('boot', 'shutdown', 'login', 'logout', 'lock', 'unlock') NOT NULL,
  occurred_at DATETIME NOT NULL,

  logged_user VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  session_id VARCHAR(100) NULL,
  duration_seconds BIGINT NULL,
  details JSON NULL,

  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_activity_device (device_id),
  INDEX idx_activity_type (event_type),
  INDEX idx_activity_occurred (occurred_at),
  INDEX idx_activity_device_type (device_id, event_type, occurred_at DESC),

  CONSTRAINT fk_activity_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historico de IP
CREATE TABLE IF NOT EXISTS device_ip_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,

  city VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  country VARCHAR(10) NULL,
  isp VARCHAR(255) NULL,

  first_seen_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  heartbeat_count INT DEFAULT 1,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_ip_history_device (device_id),
  INDEX idx_ip_history_ip (ip_address),
  UNIQUE INDEX idx_ip_history_device_ip (device_id, ip_address),

  CONSTRAINT fk_ip_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Historico de usuarios
CREATE TABLE IF NOT EXISTS device_user_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,

  first_login_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  total_sessions INT DEFAULT 1,
  total_time_seconds BIGINT DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_history_device (device_id),
  INDEX idx_user_history_user (username),
  UNIQUE INDEX idx_user_history_device_user (device_id, username),

  CONSTRAINT fk_user_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE PLANOS E ASSINATURAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,

  max_devices INT NOT NULL DEFAULT 5,
  max_users INT NOT NULL DEFAULT 1,
  max_filiais INT NOT NULL DEFAULT 1,

  feature_alerts BOOLEAN DEFAULT FALSE,
  feature_reports BOOLEAN DEFAULT FALSE,
  feature_geoip BOOLEAN DEFAULT FALSE,
  feature_api_access BOOLEAN DEFAULT FALSE,

  data_retention_days INT DEFAULT 30,
  price_monthly_cents INT DEFAULT 0,
  price_yearly_cents INT DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Planos padrao
INSERT IGNORE INTO plans (name, slug, description, max_devices, max_users, max_filiais, feature_alerts, feature_reports, feature_geoip, feature_api_access, data_retention_days, price_monthly_cents, is_default) VALUES
  ('Gratuito', 'gratuito', 'Para testes e pequenos projetos', 5, 1, 1, FALSE, FALSE, FALSE, FALSE, 30, 0, TRUE),
  ('Profissional', 'profissional', 'Para empresas em crescimento', 20, 3, 3, TRUE, TRUE, FALSE, FALSE, 90, 9900, FALSE),
  ('Empresarial', 'empresarial', 'Solucao completa para grandes empresas', 999999, 999, 999, TRUE, TRUE, TRUE, TRUE, 365, 29900, FALSE);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,

  status ENUM('active', 'canceled', 'expired', 'trial') NOT NULL DEFAULT 'trial',

  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  canceled_at DATETIME NULL,
  trial_ends_at DATETIME NULL,

  external_subscription_id VARCHAR(255) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_subscription_user (user_id),
  INDEX idx_subscription_plan (plan_id),
  INDEX idx_subscription_status (status),

  CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE ALERTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  alert_type ENUM('disk_full', 'offline', 'cpu_high', 'ram_high', 'unauthorized_location', 'security') NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',

  title VARCHAR(255) NOT NULL,
  message TEXT NULL,

  status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
  acknowledged_at DATETIME NULL,
  acknowledged_by INT NULL,
  resolved_at DATETIME NULL,

  details JSON NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_alerts_device (device_id),
  INDEX idx_alerts_type (alert_type),
  INDEX idx_alerts_status (status),

  CONSTRAINT fk_alerts_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,

  disk_warning_percent INT DEFAULT 80,
  disk_critical_percent INT DEFAULT 95,
  cpu_warning_percent INT DEFAULT 90,
  ram_warning_percent INT DEFAULT 90,
  offline_warning_minutes INT DEFAULT 60,
  offline_critical_minutes INT DEFAULT 1440,

  email_notifications BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('immediate', 'hourly', 'daily') DEFAULT 'immediate',

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE INDEX idx_alert_settings_user (user_id),
  CONSTRAINT fk_alert_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELAS DE LGPD
-- ============================================================================

CREATE TABLE IF NOT EXISTS lgpd_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO lgpd_settings (setting_key, setting_value, description) VALUES
  ('heartbeat_retention_days', '90', 'Dias para manter heartbeats detalhados'),
  ('activity_retention_days', '365', 'Dias para manter eventos de atividade'),
  ('ip_anonymize_after_days', '180', 'Dias apos os quais IPs serao anonimizados'),
  ('user_anonymize_after_days', '730', 'Dias apos os quais usernames serao anonimizados');

-- ============================================================================
-- TABELA DE PRE-REGISTRO
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_registered_devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_tag VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  filial_id INT NULL,
  registered_by INT NOT NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  enrolled BOOLEAN DEFAULT FALSE,
  device_id INT NULL,
  enrolled_at DATETIME NULL,

  INDEX idx_pre_reg_service_tag (service_tag),
  INDEX idx_pre_reg_enrolled (enrolled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICACAO
-- ============================================================================

SELECT 'Setup completo!' AS resultado;

SELECT TABLE_NAME, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;
