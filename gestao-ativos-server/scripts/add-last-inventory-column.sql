-- Script para adicionar coluna last_inventory_at na tabela devices
-- Execute este script no banco de producao

-- Verificar se a coluna existe antes de adicionar
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'devices'
    AND COLUMN_NAME = 'last_inventory_at'
);

-- Adicionar coluna se nao existir
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE devices ADD COLUMN last_inventory_at DATETIME NULL AFTER last_seen_at',
    'SELECT "Coluna last_inventory_at ja existe" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar resultado
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'devices'
AND COLUMN_NAME = 'last_inventory_at';
