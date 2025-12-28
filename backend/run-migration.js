const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Running migration...');
    
    const migrationSQL = `
      ALTER TABLE food_database
      ADD COLUMN IF NOT EXISTS potassium NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS cholesterol NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "vitaminA" NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "vitaminC" NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "vitaminD" NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS calcium NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS iron NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS magnesium NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS zinc NUMERIC(10, 2) DEFAULT 0;
    `;
    
    await client.query(migrationSQL);
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    process.exit();
  }
}

runMigration().catch(console.error);
