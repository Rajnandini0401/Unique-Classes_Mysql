import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('Connecting to MySQL server...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing DDL migration script...');
    await connection.query(sqlScript);

    console.log('==================================================');
    console.log('MySQL Database "tuition_db" Initialized Successfully!');
    console.log('==================================================');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  } finally {
    await connection.end();
  }
}

initDatabase();
