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
const net = require('net');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

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
const chatRoutes = require('./routes/chat');
const achievementRoutes = require('./routes/achievements');
const insightsRoutes = require('./routes/insights');
const leaderboardRoutes = require('./routes/leaderboard');
const plannerRoutes = require('./routes/planner');
const analyticsRoutes = require('./routes/analytics');
const aiCoachRoutes = require('./routes/aicoach');
const notificationsRoutes = require('./routes/notifications');
const socialRoutes = require('./routes/social');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3001',
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

// Attach API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/aicoach', aiCoachRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/social', socialRoutes);

// Health endpoints for monitoring and quick status checks
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'Backend is running' }));

// Centralized error handler to return JSON errors consistently
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({ msg: err.message || 'Internal server error' });
});

const startServer = async (port) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    
    // Start notification scheduler after server starts
    const scheduler = require('./scheduler');
    scheduler.start(1); // Run every 1 minute for activity reminders
    console.log('Notification scheduler started');
  }).on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}...`);
      await new Promise(resolve => server.close(resolve));
      await startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

const PORT = parseInt(process.env.PORT || '5000', 10);
startServer(PORT).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// graceful error logs
process.on('unhandledRejection', (err) => {
	console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

