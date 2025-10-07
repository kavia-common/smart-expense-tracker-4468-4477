import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Build configuration from DATABASE_URL or discrete env vars
const {
  DATABASE_URL,
  PGHOST,
  PGUSER,
  PGPASSWORD,
  PGDATABASE,
  PGPORT
} = process.env;

const poolConfig = DATABASE_URL
  ? { connectionString: DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false }
  : {
      host: PGHOST || 'localhost',
      user: PGUSER || 'expenses_user',
      password: PGPASSWORD || 'secure_password',
      database: PGDATABASE || 'expenses',
      port: PGPORT ? Number(PGPORT) : 5432
    };

const pool = new Pool(poolConfig);

// PUBLIC_INTERFACE
/**
 * query - thin wrapper around pg Pool.query with error normalization.
 * @param {string} text SQL text with placeholders
 * @param {Array<any>} params Parameter values
 */
export async function query(text, params = []) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    // Attach a status for centralized handler
    err.status = 500;
    throw err;
  }
}

// Optional connectivity check at startup (non-fatal in tests)
async function checkConnectivity() {
  try {
    await pool.query('SELECT 1');
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV !== 'test') console.log('Postgres connected');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Postgres connectivity check failed:', e.message);
  }
}
checkConnectivity();

export default pool;
