-- ============================================================================
-- MIGRACAO: Tabela de Screenshots para Auditoria de Produtividade
-- ============================================================================
-- Data: 2025
-- Descricao: Armazena metadados dos screenshots capturados pelo agente
-- LGPD: Dados sensíveis - sujeitos a retencao configuravel por plano
-- ============================================================================

-- Tabela de screenshots capturados
CREATE TABLE IF NOT EXISTS device_screenshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Usuario dono do dispositivo (para isolamento multi-tenant)',

    -- Metadados do arquivo
    storage_path VARCHAR(500) NOT NULL COMMENT 'Caminho relativo no storage',
    file_size_bytes INT NOT NULL DEFAULT 0,
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',

    -- Contexto da captura
    logged_user VARCHAR(255) NULL COMMENT 'Usuario logado no momento da captura',
    screen_width INT NULL,
    screen_height INT NULL,

    -- Timestamps
    captured_at DATETIME NOT NULL COMMENT 'Quando foi capturado no dispositivo',
    received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Quando foi recebido pelo servidor',

    -- Indices
    INDEX idx_screenshot_device (device_id),
    INDEX idx_screenshot_user (user_id),
    INDEX idx_screenshot_captured (captured_at),
    INDEX idx_screenshot_device_time (device_id, captured_at DESC),
    INDEX idx_screenshot_user_time (user_id, captured_at DESC),

    -- Foreign Keys
    CONSTRAINT fk_screenshot_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    CONSTRAINT fk_screenshot_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Comentarios para LGPD
-- ============================================================================
-- IMPORTANTE: Screenshots sao dados sensiveis e devem ser:
-- 1. Deletados conforme data_retention_days do plano do usuario
-- 2. Acessiveis apenas pelo dono da organizacao (user_id)
-- 3. Excluidos do banco E do filesystem em operacoes de cleanup
-- ============================================================================
