-- ============================================
-- REMOVER DISPOSITIVO DO BANCO DE DADOS
-- Execute no MySQL para limpar o dispositivo
-- ============================================

-- Substitua 'JQ3G294' pelo Service Tag do dispositivo a ser removido

SET @service_tag = 'JQ3G294';

-- Busca o ID do dispositivo
SELECT @device_id := id FROM devices WHERE serial_bios = @service_tag;

-- Mostra o dispositivo que sera removido
SELECT id, hostname, serial_bios, status, created_at FROM devices WHERE id = @device_id;

-- Se quiser remover, descomente as linhas abaixo:

-- Remove credenciais
DELETE FROM device_credentials WHERE device_id = @device_id;

-- Remove snapshots
DELETE FROM device_snapshots WHERE device_id = @device_id;

-- Remove heartbeats
DELETE FROM device_heartbeats WHERE device_id = @device_id;

-- Remove software
DELETE FROM device_software WHERE device_id = @device_id;

-- Remove discos
DELETE FROM device_disks WHERE device_id = @device_id;

-- Remove rede
DELETE FROM device_network WHERE device_id = @device_id;

-- Remove hardware
DELETE FROM device_hardware WHERE device_id = @device_id;

-- Remove eventos
DELETE FROM device_events WHERE device_id = @device_id;

-- Remove comandos
DELETE FROM device_commands WHERE device_id = @device_id;

-- Por ultimo, remove o dispositivo
DELETE FROM devices WHERE id = @device_id;

SELECT 'Dispositivo removido com sucesso!' AS resultado;
