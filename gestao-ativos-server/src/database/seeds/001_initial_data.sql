-- ============================================================================
-- GESTAO DE ATIVOS - SEED 001 - DADOS INICIAIS
-- ============================================================================
-- Data: 2024-01-XX
-- Descricao: Insere dados iniciais do sistema
-- ============================================================================

-- Usuario admin padrao
-- Senha: Admin@123 (ALTERAR EM PRODUCAO!)
-- Hash gerado com bcrypt rounds=12
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@empresa.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYI1HqJlvOyK', 'Administrador', 'ADMIN')
ON DUPLICATE KEY UPDATE name = name;

-- Configuracoes padrao
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
