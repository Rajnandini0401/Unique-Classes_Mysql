import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tuition_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper for single query execution
export const query = async (sql, params) => {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
};

// Helper for obtaining pooled connection (for transactions)
export const getConnection = async () => {
  return await pool.getConnection();
};

export { pool };
export default pool;
