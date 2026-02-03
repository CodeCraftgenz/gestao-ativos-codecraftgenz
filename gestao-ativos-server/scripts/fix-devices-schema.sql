-- ============================================================================
-- FIX: Corrigir schema da tabela devices para ser compativel com o codigo
-- ============================================================================
-- O codigo do servidor (agent.service.ts) espera colunas especificas que
-- nao existem no schema atual. Este script corrige isso.
-- ============================================================================

-- Primeiro, vamos ver a estrutura atual
DESCRIBE devices;

-- Dropar a tabela devices se existir (CUIDADO: apenas se nao tiver dados importantes)
-- Ou alterar para adicionar as colunas que faltam

-- Verificar se a coluna device_id existe
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'device_id');

-- Se a tabela tem service_tag mas nao device_id, precisamos recriar
-- BACKUP primeiro se tiver dados importantes

-- ============================================================================
-- RECRIAR TABELA DEVICES COM SCHEMA CORRETO
-- ============================================================================

-- Desabilitar verificacao de FK temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Dropar tabelas dependentes primeiro
DROP TABLE IF EXISTS device_credentials;
DROP TABLE IF EXISTS device_hardware;
DROP TABLE IF EXISTS device_disks;
DROP TABLE IF EXISTS device_network;
DROP TABLE IF EXISTS device_software;
DROP TABLE IF EXISTS device_heartbeats;
DROP TABLE IF EXISTS device_activity_events;
DROP TABLE IF EXISTS device_ip_history;
DROP TABLE IF EXISTS device_user_history;
DROP TABLE IF EXISTS commands;
DROP TABLE IF EXISTS command_results;
DROP TABLE IF EXISTS alerts;

-- Dropar devices
DROP TABLE IF EXISTS devices;

-- Recriar devices com schema correto
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Identificadores (como o codigo espera)
  device_id VARCHAR(36) NOT NULL UNIQUE,
  hostname VARCHAR(255) NOT NULL,
  serial_bios VARCHAR(255) NULL,
  system_uuid VARCHAR(100) NULL,
  primary_mac_address VARCHAR(17) NULL,

  -- Sistema operacional
  os_name VARCHAR(100) NULL,
  os_version VARCHAR(100) NULL,
  os_build VARCHAR(50) NULL,
  os_architecture VARCHAR(10) NULL,

  -- Agente
  agent_version VARCHAR(20) NULL,

  -- Atribuicao
  assigned_user VARCHAR(255) NULL,
  filial_id INT NULL,

  -- Status
  status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at DATETIME NULL,
  approved_at DATETIME NULL,

  -- LGPD
  lgpd_consent BOOLEAN DEFAULT FALSE,
  lgpd_consent_at DATETIME NULL,
  data_retention_days INT DEFAULT 365,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_devices_device_id (device_id),
  INDEX idx_devices_hostname (hostname),
  INDEX idx_devices_serial_bios (serial_bios),
  INDEX idx_devices_system_uuid (system_uuid),
  INDEX idx_devices_mac_address (primary_mac_address),
  INDEX idx_devices_status (status),
  INDEX idx_devices_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_credentials
CREATE TABLE device_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL UNIQUE,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  last_used_at DATETIME NULL,

  CONSTRAINT fk_device_credentials_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_hardware
CREATE TABLE device_hardware (
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
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_device_hardware_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_disks
CREATE TABLE device_disks (
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

  INDEX idx_device_disks_device (device_id),
  CONSTRAINT fk_device_disks_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_network
CREATE TABLE device_network (
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

  INDEX idx_device_network_device (device_id),
  INDEX idx_device_network_mac (mac_address),
  CONSTRAINT fk_device_network_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_software
CREATE TABLE device_software (
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

  INDEX idx_device_software_device (device_id),
  INDEX idx_device_software_name (name(255)),
  CONSTRAINT fk_device_software_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_heartbeats
CREATE TABLE device_heartbeats (
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
  INDEX idx_heartbeats_received (received_at),
  INDEX idx_heartbeats_device_received (device_id, received_at DESC),

  CONSTRAINT fk_heartbeats_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_activity_events
CREATE TABLE device_activity_events (
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

  CONSTRAINT fk_activity_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_ip_history
CREATE TABLE device_ip_history (
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

  INDEX idx_ip_history_device (device_id),
  INDEX idx_ip_history_ip (ip_address),
  UNIQUE INDEX idx_ip_history_device_ip (device_id, ip_address),

  CONSTRAINT fk_ip_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar device_user_history
CREATE TABLE device_user_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  username VARCHAR(255) NOT NULL,

  first_login_at DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  total_sessions INT DEFAULT 1,
  total_time_seconds BIGINT DEFAULT 0,

  INDEX idx_user_history_device (device_id),
  INDEX idx_user_history_user (username),
  UNIQUE INDEX idx_user_history_device_user (device_id, username),

  CONSTRAINT fk_user_history_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar commands
CREATE TABLE commands (
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
  INDEX idx_commands_status (status),
  INDEX idx_commands_device_status (device_id, status),

  CONSTRAINT fk_commands_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar command_results
CREATE TABLE command_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_id INT NOT NULL,
  device_id INT NOT NULL,

  success BOOLEAN NOT NULL,
  exit_code INT NULL,
  stdout TEXT NULL,
  stderr TEXT NULL,
  execution_time_ms INT NULL,
  error_message VARCHAR(1000) NULL,

  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_command_results_command FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE,
  CONSTRAINT fk_command_results_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recriar alerts
CREATE TABLE alerts (
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
  INDEX idx_alerts_status (status),

  CONSTRAINT fk_alerts_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reabilitar FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================

SELECT 'Schema corrigido!' AS resultado;

DESCRIBE devices;

SELECT TABLE_NAME, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE 'device%'
ORDER BY TABLE_NAME;
