-- ============================================================================
-- CRIAR TODAS AS TABELAS
-- ============================================================================

-- Usuarios
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
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Filiais
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
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO filiais (id, name, code) VALUES (1, 'Matriz', 'MTZ');

-- Devices (PRINCIPAL)
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(36) NOT NULL UNIQUE,
  hostname VARCHAR(255) NOT NULL,
  serial_bios VARCHAR(255) NULL,
  system_uuid VARCHAR(100) NULL,
  primary_mac_address VARCHAR(17) NULL,
  os_name VARCHAR(100) NULL,
  os_version VARCHAR(100) NULL,
  os_build VARCHAR(50) NULL,
  os_architecture VARCHAR(10) NULL,
  agent_version VARCHAR(20) NULL,
  assigned_user VARCHAR(255) NULL,
  filial_id INT NULL,
  status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at DATETIME NULL,
  approved_at DATETIME NULL,
  lgpd_consent BOOLEAN DEFAULT FALSE,
  lgpd_consent_at DATETIME NULL,
  data_retention_days INT DEFAULT 365,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_devices_device_id (device_id),
  INDEX idx_devices_hostname (hostname),
  INDEX idx_devices_serial_bios (serial_bios),
  INDEX idx_devices_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Planos
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

INSERT IGNORE INTO plans (name, slug, description, max_devices, max_users, max_filiais, feature_alerts, feature_reports, data_retention_days, is_default) VALUES
  ('Gratuito', 'gratuito', 'Para testes', 5, 1, 1, FALSE, FALSE, 30, TRUE),
  ('Profissional', 'profissional', 'Para empresas', 50, 5, 5, TRUE, TRUE, 90, FALSE),
  ('Empresarial', 'empresarial', 'Solucao completa', 999999, 999, 999, TRUE, TRUE, 365, FALSE);

-- Subscriptions
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
  INDEX idx_subscription_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Credentials
CREATE TABLE IF NOT EXISTS device_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  last_used_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Hardware
CREATE TABLE IF NOT EXISTS device_hardware (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  cpu_model VARCHAR(255) NULL,
  cpu_cores INT NULL,
  cpu_threads INT NULL,
  cpu_max_clock_mhz INT NULL,
  cpu_architecture VARCHAR(20) NULL,
  ram_total_gb DECIMAL(10,2) NULL,
  ram_slots_used INT NULL,
  ram_slots_total INT NULL,
  gpu_model VARCHAR(255) NULL,
  gpu_memory_gb DECIMAL(10,2) NULL,
  motherboard_manufacturer VARCHAR(255) NULL,
  motherboard_model VARCHAR(255) NULL,
  bios_version VARCHAR(100) NULL,
  bios_date VARCHAR(50) NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Disks
CREATE TABLE IF NOT EXISTS device_disks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  drive_letter VARCHAR(10) NULL,
  volume_label VARCHAR(255) NULL,
  disk_type ENUM('HDD', 'SSD', 'NVMe', 'USB', 'Network', 'Unknown') DEFAULT 'Unknown',
  file_system VARCHAR(20) NULL,
  total_gb DECIMAL(10,2) NOT NULL,
  free_gb DECIMAL(10,2) NOT NULL,
  used_percent DECIMAL(5,2) NOT NULL,
  serial_number VARCHAR(255) NULL,
  model VARCHAR(255) NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_disks_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Network
CREATE TABLE IF NOT EXISTS device_network (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  interface_name VARCHAR(255) NOT NULL,
  interface_type ENUM('Ethernet', 'WiFi', 'Virtual', 'Loopback', 'Other') DEFAULT 'Other',
  mac_address VARCHAR(17) NULL,
  ipv4_address VARCHAR(15) NULL,
  ipv4_subnet VARCHAR(15) NULL,
  ipv4_gateway VARCHAR(15) NULL,
  ipv6_address VARCHAR(45) NULL,
  dns_servers TEXT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_dhcp_enabled BOOLEAN NULL,
  speed_mbps INT NULL,
  wifi_ssid VARCHAR(255) NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_network_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Software
CREATE TABLE IF NOT EXISTS device_software (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  name VARCHAR(500) NOT NULL,
  version VARCHAR(100) NULL,
  publisher VARCHAR(255) NULL,
  install_date DATE NULL,
  install_location VARCHAR(500) NULL,
  size_mb DECIMAL(10,2) NULL,
  is_system_component BOOLEAN DEFAULT FALSE,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_software_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Heartbeats
CREATE TABLE IF NOT EXISTS device_heartbeats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  cpu_percent FLOAT NULL,
  ram_percent FLOAT NULL,
  disk_free_gb DECIMAL(10,2) NULL,
  uptime_seconds BIGINT NULL,
  ip_address VARCHAR(45) NULL,
  logged_user VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  region VARCHAR(100) NULL,
  country VARCHAR(10) NULL,
  isp VARCHAR(255) NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_heartbeats_device (device_id),
  INDEX idx_heartbeats_received (received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device Activity Events
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
  INDEX idx_activity_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device IP History
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
  INDEX idx_ip_history_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device User History
CREATE TABLE IF NOT EXISTS device_user_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,
  first_login_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  total_sessions INT DEFAULT 1,
  total_time_seconds BIGINT DEFAULT 0,
  INDEX idx_user_history_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commands
CREATE TABLE IF NOT EXISTS commands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  payload JSON NULL,
  priority INT NOT NULL DEFAULT 0,
  status ENUM('pending', 'sent', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  completed_at DATETIME NULL,
  expires_at DATETIME NULL,
  INDEX idx_commands_device (device_id),
  INDEX idx_commands_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Command Results
CREATE TABLE IF NOT EXISTS command_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_id INT NOT NULL,
  device_id INT NOT NULL,
  success BOOLEAN NOT NULL,
  exit_code INT NULL,
  stdout TEXT NULL,
  stderr TEXT NULL,
  execution_time_ms INT NULL,
  error_message VARCHAR(1000) NULL,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'warning',
  title VARCHAR(255) NOT NULL,
  message TEXT NULL,
  details JSON NULL,
  status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
  acknowledged_at DATETIME NULL,
  acknowledged_by INT NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alerts_device (device_id),
  INDEX idx_alerts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alert Settings
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
  UNIQUE INDEX idx_alert_settings_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-registered Devices
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
  INDEX idx_pre_reg_service_tag (service_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LGPD Settings
CREATE TABLE IF NOT EXISTS lgpd_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO lgpd_settings (setting_key, setting_value, description) VALUES
  ('heartbeat_retention_days', '90', 'Dias para manter heartbeats'),
  ('activity_retention_days', '365', 'Dias para manter eventos de atividade'),
  ('ip_anonymize_after_days', '180', 'Dias apos os quais IPs serao anonimizados'),
  ('user_anonymize_after_days', '730', 'Dias apos os quais usernames serao anonimizados');
