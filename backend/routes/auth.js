// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt =require('jsonwebtoken');
// const db = require('../db');

// const router = express.Router();

// // Helper to promisify jwt.sign for async/await usage
// const signToken = (payload, secret, options) => {
//     return new Promise((resolve, reject) => {
//         jwt.sign(payload, secret, options, (err, token) => {
//             if (err) return reject(err);
//             resolve(token);
//         });
//     });
// };

// // @route   POST api/auth/register
// // @desc    Register user
// router.post('/register', async (req, res) => {
//     const { email, password, lastName, weight, height, age, gender, country } = req.body;

//     try {
//         // Check if user exists
//         let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
//         if (user.rows.length > 0) {
//             return res.status(400).json({ msg: 'User already exists' });
//         }

//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const passwordHash = await bcrypt.hash(password, salt);
        
//         // Save user
//         const startWeight = parseFloat(weight);
//         const newUserQuery = `INSERT INTO users (email, last_name, password_hash, weight, start_weight, height, age, gender, country) 
//                               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
//                               RETURNING email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country`;
//         const newUserResult = await db.query(newUserQuery, [email, lastName, passwordHash, startWeight, startWeight, parseFloat(height), parseInt(age), gender, country]);
        
//         const newUser = newUserResult.rows[0];

//         // Create initial goals
//         await db.query('INSERT INTO user_goals (user_email, target_weight, weight_goal, goal_timeline) VALUES ($1, $2, $3, $4)', [email, startWeight, 'maintain', 12]);

//         // Create initial weight log entry
//         await db.query('INSERT INTO weight_logs (user_email, date, weight) VALUES ($1, $2, $3)', [email, new Date().toISOString().split('T')[0], startWeight]);

//         const payload = { user: { email: newUser.email } };
//         const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        
//         // The user object sent back is already camelCased by the RETURNING clause
//         res.json({ token, user: newUser });

//     } catch (err) {
//         console.error('Registration Error:', err.message);
//         res.status(500).json({ msg: 'Server error during registration. Please check server logs.' });
//     }
// });


// // @route   POST api/auth/login
// // @desc    Authenticate user & get token
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         // Check if user exists and fetch with camelCase aliases
//         let userQuery = await db.query('SELECT email, last_name AS "lastName", password_hash, weight, start_weight AS "startWeight", height, age, gender, country FROM users WHERE email = $1', [email]);
//         if (userQuery.rows.length === 0) {
//             return res.status(400).json({ msg: 'Invalid Credentials' });
//         }
//         const user = userQuery.rows[0];
        
//         // Compare password
//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             return res.status(400).json({ msg: 'Invalid Credentials' });
//         }

//         const payload = { user: { email: user.email } };
//         const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

//         const { password_hash, ...userResponse } = user;
//         res.json({ token, user: userResponse });

//     } catch (err) {
//         console.error('Login Error:', err.message);
//         res.status(500).json({ msg: 'Server error during login. Please check server logs.' });
//     }
// });


// module.exports = router;

// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Helper to promisify jwt.sign for async/await usage
const signToken = (payload, secret, options) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) return reject(err);
      resolve(token);
    });
  });
};

// allow preflight for this router explicitly (safe, no-op if handled globally)
router.options('*', (req, res) => {
  res.sendStatus(204);
});

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  const { email, password, lastName, weight, height, age, gender, country } = req.body;

  try {
    // Check if user exists
    let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const startWeight = parseFloat(weight);
    const newUserQuery = `INSERT INTO users (email, last_name, password_hash, weight, start_weight, height, age, gender, country) 
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                          RETURNING email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country`;
    const newUserResult = await db.query(newUserQuery, [email, lastName, passwordHash, startWeight, startWeight, parseFloat(height), parseInt(age), gender, country]);

    const newUser = newUserResult.rows[0];

    // Create initial goals
    await db.query('INSERT INTO user_goals (user_email, target_weight, weight_goal, goal_timeline) VALUES ($1, $2, $3, $4)', [email, startWeight, 'maintain', 12]);

    // Create initial weight log entry
    await db.query('INSERT INTO weight_logs (user_email, date, weight) VALUES ($1, $2, $3)', [email, new Date().toISOString().split('T')[0], startWeight]);

    const payload = { user: { email: newUser.email } };
    const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // The user object sent back is already camelCased by the RETURNING clause
    res.json({ token, user: newUser });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ msg: 'Server error during registration. Please check server logs.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists and fetch with camelCase aliases
    let userQuery = await db.query('SELECT email, last_name AS "lastName", password_hash, weight, start_weight AS "startWeight", height, age, gender, country FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }
    const user = userQuery.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { email: user.email } };
    const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    const { password_hash, ...userResponse } = user;
    res.json({ token, user: userResponse });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error during login. Please check server logs.' });
  }
});

module.exports = router;
