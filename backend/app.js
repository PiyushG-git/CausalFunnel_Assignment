const express = require('express');
const cors = require('cors');
const path = require('path');

const eventRoutes = require('./src/routes/events');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Dashboard read endpoints: restrict to known frontend origins
// Clean up FRONTEND_URL to remove any accidental trailing slashes from environment variables
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const cleanFrontendUrl = rawFrontendUrl.replace(/\/$/, '');

const defaultOrigins = [
  cleanFrontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors(function (req, callback) {
    if (req.path === '/api/events') {
      callback(null, { origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] });
    } else {
      // For dashboard endpoints, allow if origin matches our list OR if it's a vercel app (for easy deployment testing)
      const reqOrigin = req.headers.origin;
      const isAllowed = !reqOrigin || 
                        defaultOrigins.includes(reqOrigin) || 
                        reqOrigin.endsWith('.vercel.app') || 
                        !process.env.FRONTEND_URL;
                        
      callback(null, {
        origin: isAllowed ? reqOrigin || '*' : defaultOrigins[0],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      });
    }
  })
);
app.use(express.json());

// ─── Serve Tracker Script ─────────────────────────────────────────────────────
// Serves tracker/tracker.js at GET /tracker.js
// This lets the demo page (and any 3rd-party page) load the script from the
// same origin as event collection: http://localhost:5000/tracker.js
app.get('/tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.sendFile(path.resolve(__dirname, '../tracker/tracker.js'));
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', eventRoutes);

// ─── Health & Root ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'CausalFunnel Analytics API',
    status: 'running',
    endpoints: {
      health: '/health',
      tracker: '/tracker.js'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have exactly 4 params so Express treats it as an error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

module.exports = app;
