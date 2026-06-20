const express = require('express');
const cors = require('cors');
const path = require('path');

const eventRoutes = require('./src/routes/events');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
// Dashboard read endpoints: restrict to known frontend origins
const dashboardOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000']
  : '*';

app.use(
  cors(function (req, callback) {
    // The tracker runs on ANY webpage (including file:// demo pages),
    // exactly like GA / Mixpanel pixels. Open CORS for events collection.
    if (req.path === '/api/events') {
      callback(null, { origin: true, methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] });
    } else {
      // Protect dashboard routes
      callback(null, {
        origin: dashboardOrigins,
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

// ─── Health Check ─────────────────────────────────────────────────────────────
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
