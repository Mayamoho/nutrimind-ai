const db = require('../db');

const sampleFoods = [
  { name: 'Rice', serving_size: '100g', calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, sodium: 1, sugar: 0.1, fiber: 0.4, country: 'India', source: 'builtin' },
  { name: 'Chicken Breast', serving_size: '100g', calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, sodium: 74, sugar: 0, fiber: 0, country: 'United States', source: 'builtin' },
  { name: 'Lentils', serving_size: '100g', calories: 116, protein: 9, carbohydrates: 20, fat: 0.4, sodium: 2, sugar: 1.8, fiber: 8, country: 'India', source: 'builtin' },
  { name: 'Oatmeal', serving_size: '100g', calories: 389, protein: 17, carbohydrates: 66, fat: 7, sodium: 2, sugar: 1.2, fiber: 10.6, country: 'United Kingdom', source: 'builtin' },
  { name: 'Egg', serving_size: '1 large', calories: 78, protein: 6.3, carbohydrates: 0.6, fat: 5.3, sodium: 62, sugar: 0.6, fiber: 0, country: 'world', source: 'builtin' },
  { name: 'Tofu', serving_size: '100g', calories: 76, protein: 8, carbohydrates: 1.9, fat: 4.8, sodium: 7, sugar: 0.3, fiber: 0.3, country: 'China', source: 'builtin' },
  { name: 'Beans (mixed)', serving_size: '100g', calories: 127, protein: 8.7, carbohydrates: 22.8, fat: 0.5, sodium: 5, sugar: 0.3, fiber: 8.3, country: 'Mexico', source: 'builtin' },
  { name: 'Salmon', serving_size: '100g', calories: 208, protein: 20, carbohydrates: 0, fat: 13, sodium: 59, sugar: 0, fiber: 0, country: 'Norway', source: 'builtin' }
];

async function ensureSchema() {
  try {
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS food_database (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        serving_size TEXT,
        calories NUMERIC,
        protein NUMERIC,
        carbohydrates NUMERIC,
        fat NUMERIC,
        sodium NUMERIC,
        sugar NUMERIC,
        fiber NUMERIC,
        country TEXT,
        source TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert sample rows if table empty
    const res = await db.query('SELECT COUNT(*) AS c FROM food_database');
    const count = parseInt(res.rows[0].c, 10);
    if (count === 0) {
      console.log('Seeding food_database with sample data...');
      for (const f of sampleFoods) {
        await db.query(
          `INSERT INTO food_database (name, serving_size, calories, protein, carbohydrates, fat, sodium, sugar, fiber, country, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [f.name, f.serving_size, f.calories, f.protein, f.carbohydrates, f.fat, f.sodium, f.sugar, f.fiber, f.country, f.source]
        );
      }
      console.log('Seeding complete.');
    } else {
      console.log('food_database already seeded (count =', count, ')');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err && (err.message || err));
    process.exit(1);
  }
}

ensureSchema();
