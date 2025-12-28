const db = require('../db');

async function ensureUser() {
  try {
    // Check if demo user exists
    const userCheck = await db.query('SELECT email FROM users WHERE email = $1', ['demo@example.com']);
    
    if (userCheck.rows.length === 0) {
      console.log('Creating demo user...');
      await db.query(`
        INSERT INTO users (email, last_name, password_hash, weight, height, age, gender, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'demo@example.com',
        'User',
        '$2b$10$dummy.hash.for.testing.only', // dummy hash
        70.5,
        175.0,
        25,
        'male',
        'US'
      ]);
      console.log('Demo user created successfully');
    } else {
      console.log('Demo user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring user:', error);
    process.exit(1);
  }
}

ensureUser();
