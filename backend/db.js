require('dotenv').config();
const { Pool } = require('pg');

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/nutrimind';

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // make some sensible defaults
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  max: 10
});

let dbAvailable = false;
let reconnecting = null;

// Ensure single reconnect flow and avoid repeated concurrent retries
const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    dbAvailable = true;
    return true;
  } finally {
    client.release();
  }
};

const connectWithRetry = async (attempts = 4, baseDelayMs = 1000) => {
  if (reconnecting) return reconnecting;
  reconnecting = (async () => {
    for (let i = 0; i < attempts; i++) {
      try {
        await testConnection();
        console.log(`[db] Connected to Postgres (attempt ${i + 1}).`);
        reconnecting = null;
        return;
      } catch (err) {
        const delay = baseDelayMs * Math.pow(2, i);
        console.error(`[db] Postgres connection attempt ${i + 1} failed: ${err.code || err.message}. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    dbAvailable = false;
    console.error('[db] Postgres unavailable after retries.');
    reconnecting = null;
  })();
  return reconnecting;
};

// Start a background attempt once
connectWithRetry().catch(() => { /* logged above */ });

// When the pool emits error, mark as unavailable and kick off reconnection (but don't block)
pool.on('error', (err) => {
  console.error('[db] Pool error:', err && (err.message || err));
  dbAvailable = false;
  connectWithRetry().catch(() => {});
});

/**
 * Query wrapper:
 * - If marked available, run directly.
 * - If not, attempt a single quick query; if it fails, schedule background reconnect and throw DB_UNAVAILABLE.
 * This prevents many concurrent reconnect flows and noisy logs while still trying to restore connectivity.
 */
const query = async (text, params) => {
  try {
    if (dbAvailable) {
      return await pool.query(text, params);
    }
    // Try one quick attempt
    try {
      const res = await pool.query(text, params);
      dbAvailable = true;
      return res;
    } catch (err) {
      // schedule background reconnect but return DB_UNAVAILABLE immediately to callers
      connectWithRetry().catch(() => {});
      const e = new Error('Database unavailable. Ensure Postgres is running and DATABASE_URL is correct.');
      e.code = 'DB_UNAVAILABLE';
      throw e;
    }
  } catch (err) {
    if (!err.code && err.message && err.message.includes('ECONNREFUSED')) err.code = 'ECONNREFUSED';
    throw err;
  }
};

const getClient = async () => {
  if (!dbAvailable) {
    await connectWithRetry(3, 500);
    if (!dbAvailable) {
      const err = new Error('Database unavailable. Ensure Postgres is running and DATABASE_URL is correct.');
      err.code = 'DB_UNAVAILABLE';
      throw err;
    }
  }
  return pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
  isDbAvailable: () => dbAvailable,
  connectWithRetry
};
