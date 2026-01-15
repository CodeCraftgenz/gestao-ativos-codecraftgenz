-- ============================================================================
-- FIX PRODUCTION DATABASE - Criar tabelas faltantes
-- Execute no MySQL de produção (Hostinger)
-- ============================================================================

-- Tabela de heartbeats (sinal de vida do agente)
CREATE TABLE IF NOT EXISTS device_heartbeats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    -- Metricas no momento do heartbeat
    cpu_usage_percent DECIMAL(5,2) NULL,
    ram_usage_percent DECIMAL(5,2) NULL,
    disk_free_gb DECIMAL(10,2) NULL,
    uptime_seconds BIGINT NULL,

    -- Usuario logado no momento
    logged_user VARCHAR(255) NULL,

    -- Versao do agente
    agent_version VARCHAR(20) NULL,

    -- IP de origem
    ip_address VARCHAR(45) NULL,

    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_heartbeats_device (device_id),
    INDEX idx_heartbeats_received (received_at),
    INDEX idx_heartbeats_device_time (device_id, received_at DESC),

    CONSTRAINT fk_heartbeats_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metricas diarias de atividade por dispositivo (pre-calculadas)
CREATE TABLE IF NOT EXISTS device_daily_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    metric_date DATE NOT NULL,

    -- Tempo em segundos
    total_online_seconds INT NOT NULL DEFAULT 0,
    total_offline_seconds INT NOT NULL DEFAULT 0,

    -- Contadores
    heartbeat_count INT NOT NULL DEFAULT 0,
    boot_count INT NOT NULL DEFAULT 0,

    -- Primeiro e ultimo heartbeat do dia
    first_seen_at DATETIME NULL,
    last_seen_at DATETIME NULL,

    -- Usuarios que logaram no dia
    users_logged JSON NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX idx_daily_device_date (device_id, metric_date),
    INDEX idx_daily_date (metric_date),

    CONSTRAINT fk_daily_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Snapshots em Tempo Real
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
  INDEX idx_snapshots_device_collected (device_id, collected_at),

  CONSTRAINT fk_device_snapshots_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adiciona novos campos na tabela devices se nao existirem
-- Executar cada um separadamente se der erro

-- ALTER TABLE devices ADD COLUMN last_snapshot_at DATETIME NULL AFTER last_inventory_at;
-- ALTER TABLE devices ADD COLUMN last_cpu_percent FLOAT NULL AFTER assigned_user;
-- ALTER TABLE devices ADD COLUMN last_ram_percent FLOAT NULL AFTER last_cpu_percent;
-- ALTER TABLE devices ADD COLUMN uptime_seconds BIGINT NULL AFTER last_ram_percent;

-- Atualiza ENUM de status para incluir 'standby' (pode precisar adaptar se ja existir)
-- ALTER TABLE devices MODIFY COLUMN status ENUM('pending', 'standby', 'approved', 'blocked', 'offline', 'online') NOT NULL DEFAULT 'pending';

SELECT 'Tabelas criadas com sucesso!' AS resultado;
