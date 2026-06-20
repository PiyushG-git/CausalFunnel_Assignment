const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getHeatmapPages,
} = require('../controllers/eventController');

// ─── Event Routes ─────────────────────────────────────────────────────────────

// POST /api/events — Public endpoint (tracker doesn't need an API key)
// Same pattern as Google Analytics / Mixpanel collection endpoints
router.post('/events', createEvents);

// ─── Session Routes (protected) ───────────────────────────────────────────────

// GET /api/sessions — Requires x-api-key (or open if API_KEY not set in .env)
router.get('/sessions', auth, getSessions);

// GET /api/sessions/:session_id/events — Requires x-api-key
router.get('/sessions/:session_id/events', auth, getSessionEvents);

// ─── Heatmap Routes (protected) ───────────────────────────────────────────────

// GET /api/heatmap/pages — Must be BEFORE /heatmap to avoid route shadowing
router.get('/heatmap/pages', auth, getHeatmapPages);

// GET /api/heatmap?page_url=<url>
router.get('/heatmap', auth, getHeatmapData);

module.exports = router;
