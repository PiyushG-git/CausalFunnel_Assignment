const express = require('express');
const router = express.Router();
const {
  createEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getHeatmapPages,
} = require('../controllers/eventController');

// ─── Event Routes ─────────────────────────────────────────────────────────────

// POST /api/events — Ingest one or more tracked events
router.post('/events', createEvents);

// ─── Session Routes ───────────────────────────────────────────────────────────

// GET /api/sessions — List all sessions with event count summary
router.get('/sessions', getSessions);

// GET /api/sessions/:session_id/events — Full event journey for a session
router.get('/sessions/:session_id/events', getSessionEvents);

// ─── Heatmap Routes ───────────────────────────────────────────────────────────

// GET /api/heatmap?page_url=<url> — Click data for a specific page
router.get('/heatmap', getHeatmapData);

// GET /api/heatmap/pages — List all pages with click data
router.get('/heatmap/pages', getHeatmapPages);

module.exports = router;
