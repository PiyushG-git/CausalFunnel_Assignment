const Event = require('../models/Event');

// ─── POST /api/events ─────────────────────────────────────────────────────────
// Receive one or more events from the tracker script
const createEvents = async (req, res) => {
  try {
    const body = req.body;

    // Accept both single event or array of events
    const eventsArray = Array.isArray(body) ? body : [body];

    if (eventsArray.length === 0) {
      return res.status(400).json({ error: 'No events provided' });
    }

    // Validate required fields
    for (const evt of eventsArray) {
      if (!evt.session_id || !evt.event_type || !evt.page_url) {
        return res.status(400).json({
          error: 'Each event must have session_id, event_type, and page_url',
        });
      }
      if (!['page_view', 'click'].includes(evt.event_type)) {
        return res.status(400).json({
          error: `Invalid event_type: ${evt.event_type}. Must be page_view or click`,
        });
      }
    }

    const savedEvents = await Event.insertMany(eventsArray);
    return res.status(201).json({
      message: `${savedEvents.length} event(s) stored successfully`,
      count: savedEvents.length,
    });
  } catch (err) {
    console.error('createEvents error:', err);
    return res.status(500).json({ error: 'Failed to store events' });
  }
};

// ─── GET /api/sessions ────────────────────────────────────────────────────────
// List all unique sessions with event counts and first/last seen times
const getSessions = async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$session_id',
          total_events: { $sum: 1 },
          click_count: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          page_view_count: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          first_seen: { $min: '$timestamp' },
          last_seen: { $max: '$timestamp' },
          pages_visited: { $addToSet: '$page_url' },
        },
      },
      {
        $sort: { last_seen: -1 }, // most recent first
      },
      {
        $project: {
          session_id: '$_id',
          total_events: 1,
          click_count: 1,
          page_view_count: 1,
          first_seen: 1,
          last_seen: 1,
          pages_visited: { $size: '$pages_visited' },
          _id: 0,
        },
      },
    ]);

    return res.json({ sessions, total: sessions.length });
  } catch (err) {
    console.error('getSessions error:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// ─── GET /api/sessions/:session_id/events ────────────────────────────────────
// Get all events for a specific session, ordered by timestamp
const getSessionEvents = async (req, res) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const events = await Event.find({ session_id })
      .sort({ timestamp: 1 }) // chronological order = user journey
      .select('-__v')
      .lean();

    if (events.length === 0) {
      return res.status(404).json({ error: 'No events found for this session' });
    }

    return res.json({ session_id, events, total: events.length });
  } catch (err) {
    console.error('getSessionEvents error:', err);
    return res.status(500).json({ error: 'Failed to fetch session events' });
  }
};

// ─── GET /api/heatmap?page_url=<url> ─────────────────────────────────────────
// Fetch click coordinates for a specific page (for heatmap rendering)
const getHeatmapData = async (req, res) => {
  try {
    const { page_url } = req.query;

    if (!page_url) {
      return res.status(400).json({ error: 'page_url query parameter is required' });
    }

    const clicks = await Event.find({
      page_url,
      event_type: 'click',
      x: { $ne: null },
      y: { $ne: null },
    })
      .select('x y viewport_width viewport_height timestamp session_id -_id')
      .sort({ timestamp: -1 })
      .lean();

    // Also get list of all pages that have click data (for dropdown)
    const availablePages = await Event.distinct('page_url', { event_type: 'click' });

    return res.json({
      page_url,
      clicks,
      total_clicks: clicks.length,
      available_pages: availablePages,
    });
  } catch (err) {
    console.error('getHeatmapData error:', err);
    return res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};

// ─── GET /api/heatmap/pages ───────────────────────────────────────────────────
// List all pages that have click data
const getHeatmapPages = async (req, res) => {
  try {
    const pages = await Event.distinct('page_url', { event_type: 'click' });
    return res.json({ pages });
  } catch (err) {
    console.error('getHeatmapPages error:', err);
    return res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

module.exports = {
  createEvents,
  getSessions,
  getSessionEvents,
  getHeatmapData,
  getHeatmapPages,
};
