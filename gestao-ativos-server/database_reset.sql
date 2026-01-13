-- ============================================================================
-- GESTAO DE ATIVOS - RESET DO BANCO DE DADOS
-- ============================================================================
-- CUIDADO: Este script APAGA todas as tabelas e dados!
-- Execute antes do database_complete.sql se precisar resetar
-- ============================================================================

USE u984096926_codecrafgenz;

-- Desabilita verificacao de FK temporariamente para poder dropar em qualquer ordem
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS _migrations;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS inventory_snapshots;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS command_results;
DROP TABLE IF EXISTS commands;
DROP TABLE IF EXISTS device_software;
DROP TABLE IF EXISTS device_network;
DROP TABLE IF EXISTS device_disks;
DROP TABLE IF EXISTS device_hardware;
DROP TABLE IF EXISTS device_credentials;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS filiais;
DROP TABLE IF EXISTS users;

-- Reabilita verificacao de FK
SET FOREIGN_KEY_CHECKS = 1;

-- Verifica se limpou tudo
SHOW TABLES;
