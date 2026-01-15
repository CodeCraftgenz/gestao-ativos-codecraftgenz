-- ============================================================================
-- GESTAO DE ATIVOS - MIGRATION 003 - SNAPSHOTS E STATUS STANDBY
-- ============================================================================
-- Data: 2025-01-15
-- Descricao: Adiciona tabela de snapshots em tempo real e status standby
-- ============================================================================

-- Adiciona novos campos na tabela devices (apenas se nao existirem)
-- Nota: Execute cada ALTER separadamente se algum falhar

-- Adiciona last_snapshot_at se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'last_snapshot_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN last_snapshot_at DATETIME NULL AFTER last_inventory_at',
    'SELECT "Column last_snapshot_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona last_cpu_percent se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'last_cpu_percent');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN last_cpu_percent FLOAT NULL AFTER assigned_user',
    'SELECT "Column last_cpu_percent already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona last_ram_percent se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'last_ram_percent');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN last_ram_percent FLOAT NULL AFTER last_cpu_percent',
    'SELECT "Column last_ram_percent already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adiciona uptime_seconds se nao existir
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'devices' AND COLUMN_NAME = 'uptime_seconds');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE devices ADD COLUMN uptime_seconds BIGINT NULL AFTER last_ram_percent',
    'SELECT "Column uptime_seconds already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualiza ENUM de status para incluir 'standby'
ALTER TABLE devices
MODIFY COLUMN status ENUM('pending', 'standby', 'approved', 'blocked', 'offline', 'online') NOT NULL DEFAULT 'pending';

-- Tabela de Snapshots em Tempo Real (sem FK inline para evitar erro de constraint duplicada)
CREATE TABLE IF NOT EXISTS device_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,

  -- Metricas de CPU
  cpu_usage_percent FLOAT NULL,
  cpu_temperature FLOAT NULL,

  -- Metricas de RAM
  ram_usage_percent FLOAT NULL,
  ram_used_gb DECIMAL(10,2) NULL,
  ram_available_gb DECIMAL(10,2) NULL,

  -- Metricas de GPU
  gpu_usage_percent FLOAT NULL,
  gpu_temperature FLOAT NULL,

  -- Metricas de Rede
  network_bytes_sent BIGINT NULL,
  network_bytes_received BIGINT NULL,
  network_send_speed_mbps FLOAT NULL,
  network_receive_speed_mbps FLOAT NULL,

  -- Status geral
  uptime_seconds BIGINT NULL,
  `current_user` VARCHAR(255) NULL,

  -- Timestamps
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indices
  INDEX idx_snapshots_device_id (device_id),
  INDEX idx_snapshots_collected_at (collected_at),
  INDEX idx_snapshots_device_collected (device_id, collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adiciona FK separadamente (so se nao existir)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'device_snapshots'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    AND CONSTRAINT_NAME = 'fk_device_snapshots_device_id');
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE device_snapshots ADD CONSTRAINT fk_device_snapshots_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE',
    'SELECT "FK fk_device_snapshots_device_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Limpa snapshots antigos automaticamente (manter apenas 7 dias)
-- Recomendado: criar um evento agendado no MySQL para limpeza
-- CREATE EVENT IF NOT EXISTS cleanup_old_snapshots
-- ON SCHEDULE EVERY 1 DAY
-- DO DELETE FROM device_snapshots WHERE collected_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
