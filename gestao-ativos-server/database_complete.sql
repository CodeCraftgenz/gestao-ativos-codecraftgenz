-- ============================================================================
-- GESTAO DE ATIVOS - SQL COMPLETO PARA CRIAR TODAS AS TABELAS
-- ============================================================================
-- Banco: u984096926_codecrafgenz
-- Host: Hostinger
-- Execute este script inteiro no phpMyAdmin
-- ============================================================================

-- Usa o banco de dados (ja existe na Hostinger)
USE u984096926_codecrafgenz;

-- ============================================================================
-- TABELA: users (Usuarios do painel administrativo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'OPERADOR', 'LEITURA') NOT NULL DEFAULT 'LEITURA',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: filiais (Filiais/Unidades da empresa)
-- ============================================================================
CREATE TABLE IF NOT EXISTS filiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    palavras_chave TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_filiais_codigo (codigo),
    INDEX idx_filiais_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: devices (Dispositivos/Maquinas registradas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(36) NOT NULL UNIQUE COMMENT 'GUID unico gerado pelo agente',

    -- Identificadores de hardware (anti-duplicidade)
    hostname VARCHAR(255) NOT NULL,
    serial_bios VARCHAR(255) NULL,
    system_uuid VARCHAR(36) NULL,
    primary_mac_address VARCHAR(17) NULL,

    -- Informacoes do SO
    os_name VARCHAR(100) NULL,
    os_version VARCHAR(100) NULL,
    os_build VARCHAR(50) NULL,
    os_architecture VARCHAR(10) NULL,

    -- Status e controle
    status ENUM('pending', 'approved', 'blocked', 'offline', 'online') NOT NULL DEFAULT 'pending',
    agent_version VARCHAR(20) NULL,
    last_seen_at DATETIME NULL,
    last_inventory_at DATETIME NULL,

    -- Aprovacao
    approved_at DATETIME NULL,
    approved_by INT NULL,
    blocked_at DATETIME NULL,
    blocked_by INT NULL,
    block_reason VARCHAR(500) NULL,

    -- Relacionamentos
    filial_id INT NULL,
    department VARCHAR(100) NULL,
    assigned_user VARCHAR(255) NULL COMMENT 'Usuario logado no momento do enrollment',

    -- Metadados
    notes TEXT NULL,
    tags JSON NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indices
    INDEX idx_devices_device_id (device_id),
    INDEX idx_devices_hostname (hostname),
    INDEX idx_devices_serial_bios (serial_bios),
    INDEX idx_devices_system_uuid (system_uuid),
    INDEX idx_devices_mac (primary_mac_address),
    INDEX idx_devices_status (status),
    INDEX idx_devices_last_seen (last_seen_at),
    INDEX idx_devices_filial (filial_id),

    -- Foreign keys
    CONSTRAINT fk_devices_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_devices_blocked_by FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_devices_filial FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: device_credentials (Tokens de autenticacao dos agentes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    agent_token_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 do token',
    refresh_token_hash VARCHAR(64) NULL,

    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    last_used_at DATETIME NULL,
    revoked_at DATETIME NULL,
    revoked_by INT NULL,
    revoke_reason VARCHAR(255) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_credentials_device (device_id),
    INDEX idx_credentials_token (agent_token_hash),
    INDEX idx_credentials_revoked (revoked_at),

    CONSTRAINT fk_credentials_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_credentials_revoked_by FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: device_hardware (Informacoes de hardware do dispositivo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_hardware (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    -- CPU
    cpu_model VARCHAR(255) NULL,
    cpu_cores INT NULL,
    cpu_threads INT NULL,
    cpu_max_clock_mhz INT NULL,
    cpu_architecture VARCHAR(20) NULL,

    -- Memoria
    ram_total_gb DECIMAL(10,2) NULL,
    ram_slots_used INT NULL,
    ram_slots_total INT NULL,

    -- GPU
    gpu_model VARCHAR(255) NULL,
    gpu_memory_gb DECIMAL(10,2) NULL,

    -- Placa-mae
    motherboard_manufacturer VARCHAR(255) NULL,
    motherboard_model VARCHAR(255) NULL,
    bios_version VARCHAR(100) NULL,
    bios_date VARCHAR(50) NULL,

    -- Metadados
    collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_hardware_device (device_id),
    INDEX idx_hardware_collected (collected_at),

    CONSTRAINT fk_hardware_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: device_disks (Discos do dispositivo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_disks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    drive_letter VARCHAR(10) NULL COMMENT 'C:, D:, etc.',
    volume_label VARCHAR(255) NULL,
    disk_type ENUM('HDD', 'SSD', 'NVMe', 'USB', 'Network', 'Unknown') NOT NULL DEFAULT 'Unknown',
    file_system VARCHAR(20) NULL,
    total_gb DECIMAL(10,2) NOT NULL,
    free_gb DECIMAL(10,2) NOT NULL,
    used_percent DECIMAL(5,2) NOT NULL,

    serial_number VARCHAR(255) NULL,
    model VARCHAR(255) NULL,

    collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_disks_device (device_id),
    INDEX idx_disks_collected (collected_at),

    CONSTRAINT fk_disks_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: device_network (Interfaces de rede do dispositivo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_network (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    interface_name VARCHAR(255) NOT NULL,
    interface_type ENUM('Ethernet', 'WiFi', 'Virtual', 'Loopback', 'Other') NOT NULL DEFAULT 'Other',
    mac_address VARCHAR(17) NULL,
    ipv4_address VARCHAR(15) NULL,
    ipv4_subnet VARCHAR(15) NULL,
    ipv4_gateway VARCHAR(15) NULL,
    ipv6_address VARCHAR(45) NULL,
    dns_servers JSON NULL,

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_dhcp_enabled BOOLEAN NULL,
    speed_mbps INT NULL,

    wifi_ssid VARCHAR(255) NULL,

    collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_network_device (device_id),
    INDEX idx_network_mac (mac_address),
    INDEX idx_network_collected (collected_at),

    CONSTRAINT fk_network_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: device_software (Softwares instalados no dispositivo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_software (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    name VARCHAR(500) NOT NULL,
    version VARCHAR(100) NULL,
    publisher VARCHAR(255) NULL,
    install_date DATE NULL,
    install_location VARCHAR(500) NULL,
    size_mb DECIMAL(10,2) NULL,

    is_system_component BOOLEAN NOT NULL DEFAULT FALSE,
    uninstall_string VARCHAR(1000) NULL,

    collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_software_device (device_id),
    INDEX idx_software_name (name(100)),
    INDEX idx_software_publisher (publisher(100)),
    INDEX idx_software_collected (collected_at),

    CONSTRAINT fk_software_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: commands (Comandos para execucao no agente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS commands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    type ENUM(
        'COLLECT_INVENTORY',
        'COLLECT_SOFTWARE',
        'SEND_LOGS',
        'RESTART_AGENT',
        'UPDATE_AGENT',
        'EXECUTE_SCRIPT',
        'PING',
        'SHUTDOWN',
        'RESTART_PC'
    ) NOT NULL,

    payload JSON NULL COMMENT 'Parametros especificos do comando',
    priority TINYINT NOT NULL DEFAULT 5 COMMENT '1=Baixa, 5=Normal, 10=Alta',

    status ENUM('pending', 'sent', 'running', 'completed', 'failed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',

    created_by INT NOT NULL,
    expires_at DATETIME NULL COMMENT 'Comando expira se nao for executado ate esta data',
    sent_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_commands_device (device_id),
    INDEX idx_commands_status (status),
    INDEX idx_commands_type (type),
    INDEX idx_commands_pending (device_id, status) COMMENT 'Para buscar comandos pendentes',
    INDEX idx_commands_created (created_at),

    CONSTRAINT fk_commands_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_commands_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: command_results (Resultados dos comandos executados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS command_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    command_id INT NOT NULL,

    success BOOLEAN NOT NULL,
    exit_code INT NULL,
    stdout TEXT NULL,
    stderr TEXT NULL,
    execution_time_ms INT NULL,

    error_message VARCHAR(1000) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_results_command (command_id),
    INDEX idx_results_success (success),

    CONSTRAINT fk_results_command FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: events (Eventos/logs enviados pelo agente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    type VARCHAR(50) NOT NULL COMMENT 'AGENT_STARTED, AGENT_STOPPED, ERROR, WARNING, INFO, etc.',
    severity ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',

    message VARCHAR(1000) NOT NULL,
    details JSON NULL,

    source VARCHAR(100) NULL COMMENT 'Componente que gerou o evento',

    occurred_at DATETIME NOT NULL COMMENT 'Quando o evento ocorreu no agente',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Quando foi registrado no servidor',

    INDEX idx_events_device (device_id),
    INDEX idx_events_type (type),
    INDEX idx_events_severity (severity),
    INDEX idx_events_occurred (occurred_at),
    INDEX idx_events_device_time (device_id, occurred_at DESC),

    CONSTRAINT fk_events_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: inventory_snapshots (Historico de inventario)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,

    snapshot_type ENUM('hardware', 'disks', 'network', 'software', 'full') NOT NULL,
    snapshot_data JSON NOT NULL,

    checksum VARCHAR(64) NULL COMMENT 'SHA-256 do snapshot para detectar mudancas',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_snapshots_device (device_id),
    INDEX idx_snapshots_type (snapshot_type),
    INDEX idx_snapshots_created (created_at),

    CONSTRAINT fk_snapshots_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: audit_logs (Logs de auditoria - acoes dos admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'NULL para acoes do sistema',

    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, APPROVE, BLOCK, SEND_COMMAND, etc.',
    entity_type VARCHAR(50) NOT NULL COMMENT 'device, user, command, etc.',
    entity_id VARCHAR(50) NULL,

    old_values JSON NULL,
    new_values JSON NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: system_config (Configuracoes do sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NULL,
    config_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description VARCHAR(500) NULL,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,

    INDEX idx_config_key (config_key),

    CONSTRAINT fk_config_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: _migrations (Controle de migrations executadas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS _migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DADOS INICIAIS
-- ============================================================================

-- Usuario admin padrao
-- Email: admin@empresa.com
-- Senha: Admin@123 (ALTERAR EM PRODUCAO!)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@empresa.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYI1HqJlvOyK', 'Administrador', 'ADMIN')
ON DUPLICATE KEY UPDATE name = name;

-- Configuracoes padrao do sistema
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('heartbeat_interval_seconds', '60', 'number', 'Intervalo de heartbeat do agente em segundos'),
('heartbeat_timeout_seconds', '180', 'number', 'Tempo para considerar agente offline'),
('inventory_interval_hours', '24', 'number', 'Intervalo de coleta de inventario em horas'),
('auto_approve_devices', 'false', 'boolean', 'Aprovar dispositivos automaticamente'),
('command_expiry_hours', '24', 'number', 'Tempo de expiracao de comandos pendentes'),
('max_events_per_device', '10000', 'number', 'Maximo de eventos armazenados por dispositivo'),
('agent_min_version', '1.0.0', 'string', 'Versao minima aceita do agente')
ON DUPLICATE KEY UPDATE config_value = config_value;

-- Filiais de exemplo
INSERT INTO filiais (codigo, descricao, palavras_chave) VALUES
('100000', 'Ribeirao Preto', 'ribeirao,rp,matriz'),
('200000', 'Araraquara', 'araraquara,ara'),
('300000', 'Barretos', 'barretos'),
('400000', 'Guaira', 'guaira'),
('500000', 'Ituverava', 'ituverava'),
('600000', 'Orlandia', 'orlandia'),
('700000', 'Sao Joaquim da Barra', 'sao joaquim,sjb'),
('800000', 'Bebedouro', 'bebedouro')
ON DUPLICATE KEY UPDATE descricao = descricao;

-- Registra migration como executada
INSERT INTO _migrations (name) VALUES ('001_initial_schema.sql')
ON DUPLICATE KEY UPDATE name = name;

-- ============================================================================
-- VERIFICACAO FINAL
-- ============================================================================
-- Execute esta query para verificar se todas as tabelas foram criadas:
-- SHOW TABLES;

-- Resultado esperado:
-- +----------------------------------+
-- | Tables_in_u984096926_db_overley  |
-- +----------------------------------+
-- | _migrations                      |
-- | audit_logs                       |
-- | command_results                  |
-- | commands                         |
-- | device_credentials               |
-- | device_disks                     |
-- | device_hardware                  |
-- | device_network                   |
-- | device_software                  |
-- | devices                          |
-- | events                           |
-- | filiais                          |
-- | inventory_snapshots              |
-- | system_config                    |
-- | users                            |
-- +----------------------------------+
