-- ============================================================================
-- FIX: Criar tabela pre_registered_devices se nao existir
-- ============================================================================
-- Execute no banco de producao para corrigir erro 500 em register-by-service-tag
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

-- Adiciona FK se possivel (pode falhar se tabelas nao existirem)
-- ALTER TABLE pre_registered_devices ADD CONSTRAINT fk_pre_reg_filial FOREIGN KEY (filial_id) REFERENCES filiais(id) ON DELETE SET NULL;
-- ALTER TABLE pre_registered_devices ADD CONSTRAINT fk_pre_reg_user FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE pre_registered_devices ADD CONSTRAINT fk_pre_reg_device FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;

SELECT 'Tabela pre_registered_devices criada/verificada!' AS resultado;
