import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Default values point to the local PostgreSQL instance matching the user's config
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sevee_designs',
  password: process.env.DB_PASSWORD || 'Emercity@123',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
