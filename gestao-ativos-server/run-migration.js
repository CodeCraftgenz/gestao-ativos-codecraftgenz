// Script para executar migração
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'gestao_ativos',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'src/database/migrations/002_pre_registered_devices.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando migração 002_pre_registered_devices.sql...');
    await connection.query(sql);
    console.log('Migração executada com sucesso!');
  } catch (error) {
    console.error('Erro na migração:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();
