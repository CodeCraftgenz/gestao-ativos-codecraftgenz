-- ============================================================================
-- GESTAO DE ATIVOS - MIGRATION 002 - PRE-REGISTRO DE DISPOSITIVOS
-- ============================================================================
-- Data: 2026-01-10
-- Descricao: Tabela para pre-registro de dispositivos por Service Tag
-- ============================================================================

-- Tabela de dispositivos pre-registrados (aguardando enrollment)
CREATE TABLE IF NOT EXISTS pre_registered_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Service Tag que identifica o dispositivo
    service_tag VARCHAR(255) NOT NULL UNIQUE,

    -- Descricao opcional do dispositivo
    description VARCHAR(500) NULL,

    -- Filial associada (opcional)
    filial_id INT NULL,

    -- Quem registrou e quando
    registered_by INT NOT NULL,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Se ja foi vinculado a um dispositivo
    enrolled BOOLEAN NOT NULL DEFAULT FALSE,
    device_id INT NULL COMMENT 'ID do dispositivo apos enrollment',
    enrolled_at DATETIME NULL,

    -- Indices
    INDEX idx_prereg_service_tag (service_tag),
    INDEX idx_prereg_enrolled (enrolled),
    INDEX idx_prereg_filial (filial_id),

    -- Foreign keys
    CONSTRAINT fk_prereg_registered_by FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_prereg_filial FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL,
    CONSTRAINT fk_prereg_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: A coluna ip_address deve ser adicionada manualmente se nao existir:
-- ALTER TABLE device_network ADD COLUMN ip_address VARCHAR(45) NULL AFTER mac_address;
-- UPDATE device_network SET ip_address = ipv4_address WHERE ip_address IS NULL AND ipv4_address IS NOT NULL;
