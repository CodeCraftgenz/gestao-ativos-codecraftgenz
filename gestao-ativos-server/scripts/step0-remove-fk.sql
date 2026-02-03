-- PASSO 0: Remover as Foreign Keys manualmente
-- Execute CADA linha separadamente se der erro

-- Tentar descobrir quais FKs existem apontando para devices
-- Se voce tem acesso ao phpMyAdmin, va em "Estrutura" da tabela devices
-- e veja as "Relacoes" para saber quais FKs existem

-- Tente remover FKs conhecidas (execute uma por uma):
ALTER TABLE device_credentials DROP FOREIGN KEY fk_device_credentials_device;
ALTER TABLE device_hardware DROP FOREIGN KEY fk_device_hardware_device;
ALTER TABLE device_disks DROP FOREIGN KEY fk_device_disks_device;
ALTER TABLE device_network DROP FOREIGN KEY fk_device_network_device;
ALTER TABLE device_software DROP FOREIGN KEY fk_device_software_device;
ALTER TABLE device_heartbeats DROP FOREIGN KEY fk_heartbeats_device;
ALTER TABLE device_activity_events DROP FOREIGN KEY fk_activity_device;
ALTER TABLE device_ip_history DROP FOREIGN KEY fk_ip_history_device;
ALTER TABLE device_user_history DROP FOREIGN KEY fk_user_history_device;
ALTER TABLE commands DROP FOREIGN KEY fk_commands_device;
ALTER TABLE command_results DROP FOREIGN KEY fk_command_results_device;
ALTER TABLE alerts DROP FOREIGN KEY fk_alerts_device;
