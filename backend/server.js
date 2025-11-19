/**
 * NutriMind Backend Server
 * Connects the API routes and configures development-friendly CORS so that the
 * Vite frontend (localhost:3000) can communicate with this Express server
 * (localhost:3001) without changing URLs or hitting CORS errors.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

let cookieParser;
try {
	// use real cookie-parser if installed
	cookieParser = require('cookie-parser');
} catch (e) {
	// lightweight fallback to avoid crashing when package missing
	console.warn('cookie-parser not installed; using fallback. Run: npm install cookie-parser');
	cookieParser = function () {
		return function (req, res, next) {
			const header = req.headers.cookie || '';
			req.cookies = header
				.split(';')
				.map(s => s.trim())
				.filter(Boolean)
				.reduce((acc, pair) => {
					const idx = pair.indexOf('=');
					if (idx === -1) return acc;
					const key = pair.slice(0, idx).trim();
					const val = decodeURIComponent(pair.slice(idx + 1).trim());
					acc[key] = val;
					return acc;
				}, {});
			next();
		};
	};
}

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const geminiRoutes = require('./routes/gemini');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
		credentials: true,
	})
);

// Basic dev logger to trace proxy issues (disabled on production)
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Lightweight auth helper inlined to avoid missing files. If you add middleware file, prefer that.
function verifyTokenFromReq(req) {
	const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
	if (!token) return null;
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// decoded should contain user id in your token generation logic
		return decoded;
	} catch (err) {
		return null;
	}
}

// Ensure a stable user endpoint so frontend gets a clear 200 or 401.
app.get('/api/data/user', (req, res) => {
	const decoded = verifyTokenFromReq(req);
	if (!decoded || !decoded.id) {
		// don't retry indefinitely on frontend — return proper 401
		return res.status(401).json({ error: 'Unauthenticated' });
	}
	// Minimal response: the frontend needs a stable payload shape.
	// You can replace this with a DB fetch to return full user data.
	const user = { id: decoded.id }; // expand with name/email after querying DB
	return res.status(200).json({ success: true, user });
});

// Attach API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);

// Health endpoints for monitoring and quick status checks
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'Backend is running' }));

// Centralized error handler to return JSON errors consistently
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({ msg: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// graceful error logs
process.on('unhandledRejection', (err) => {
	console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

