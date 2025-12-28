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

// DB error helper (same behavior as other files)
const handleDbError = (err, res) => {
  if (!err) return false;
  const code = err.code || '';
  if (code === 'DB_UNAVAILABLE' || code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database unavailable. Try again later.' });
  }
  return false;
};

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

    // Create payload with complete user data
    const payload = { user: newUser };
    const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Set cookie for convenience (HttpOnly). Frontend may also use Authorization header.
    try {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.SESSION_SAMESITE || 'lax',
        maxAge: 5 * 60 * 60 * 1000 // 5 hours
      };
      res.cookie('token', token, cookieOptions);
    } catch (e) {
      // ignore cookie set failures
    }

    // The user object sent back is already camelCased by the RETURNING clause
    res.json({ token, user: newUser });
  } catch (err) {
    console.error('Registration Error:', err.message);
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

    // Create payload with complete user data (excluding sensitive info)
    const { password_hash, ...userWithoutPassword } = user;
    const payload = { 
      user: userWithoutPassword 
    };
    const token = await signToken(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Set HttpOnly cookie as well as returning token in JSON
    try {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: process.env.SESSION_SAMESITE || 'lax',
        maxAge: 5 * 60 * 60 * 1000 // 5 hours
      };
      res.cookie('token', token, cookieOptions);
    } catch (e) {}

    // Return the same user data that's in the token
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ msg: 'Server error during login. Please check server logs.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user from token
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ msg: 'User email not found in token' });
    }
    
    const userQuery = await db.query('SELECT email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ user: userQuery.rows[0] });
  } catch (err) {
    if (handleDbError(err, res)) return;
    console.error('Get User Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { lastName, country, password } = req.body;
    // Extract email from user object
    const email = req.user && (typeof req.user === 'object' ? req.user.email : req.user);
    
    if (!email) {
      return res.status(400).json({ msg: 'User email not found in token' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramIndex++}`);
      values.push(country);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ msg: 'No fields to update' });
    }
    
    values.push(email);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE email = $${paramIndex} RETURNING email, last_name AS "lastName", weight, start_weight AS "startWeight", height, age, gender, country`;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({ user: result.rows[0], msg: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ msg: 'Server error updating profile' });
  }
});

module.exports = router;
