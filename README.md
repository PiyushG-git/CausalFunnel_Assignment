# CausalFunnel — User Analytics Application

> A full-stack user analytics platform built for the CausalFunnel Full Stack Engineer hiring assignment. Tracks user interactions on any webpage in real-time and visualizes session data and click heatmaps through a modern analytics dashboard.

---

## Live Demo

| Service | URL |
|---|---|
| **Dashboard** | [https://causal-funnel-assignment-seven.vercel.app](https://causal-funnel-assignment-seven.vercel.app) |
| **Backend API** | [https://causalfunnel-assignment-99vz.onrender.com](https://causalfunnel-assignment-99vz.onrender.com) |
| **Health Check** | [https://causalfunnel-assignment-99vz.onrender.com/health](https://causalfunnel-assignment-99vz.onrender.com/health) |
| **Demo Page** | Open `demo/index.html` in any browser |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · Vite · Vanilla CSS |
| **Backend** | Node.js · Express.js |
| **Database** | MongoDB · Mongoose ODM |
| **Tracking Script** | Vanilla JavaScript (zero dependencies, embeddable) |
| **Testing** | Jest · Supertest |
| **Deployment** | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

---

## Requirements Coverage

### 1. Event Tracking (Client Side)
The tracking script (`tracker/tracker.js`) is a self-contained, embeddable JavaScript snippet with zero dependencies.

**Events tracked:**
- `page_view` — fired on initial load and SPA navigation (`pushState` / `popstate`)
- `click` — every user click with pixel coordinates

**Each event captures:**
- `session_id` — unique ID stored in `localStorage`, persists across page refreshes
- `event_type` — `page_view` or `click`
- `page_url` — full URL of the current page
- `timestamp` — ISO 8601 string
- `x`, `y` — click coordinates (click events only)
- `viewport_width`, `viewport_height` — for normalizing coordinates across screen sizes
- `user_agent` — browser/device info
- `timezone` — user's local timezone (e.g., `Asia/Kolkata`)
- `referrer` — traffic source URL

**Usage on any webpage:**
```html
<script
  src="https://causalfunnel-assignment-99vz.onrender.com/tracker.js"
  data-endpoint="https://causalfunnel-assignment-99vz.onrender.com/api/events">
</script>
```

---

### 2. Backend (Node.js / Express)

All API endpoints are implemented in Express with Mongoose for MongoDB queries.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Receive and store events (single or batched array) |
| `GET` | `/api/sessions` | Fetch all sessions with event counts, first/last seen, timezone |
| `GET` | `/api/sessions/:session_id/events` | Fetch all events for a specific session (descending) |
| `GET` | `/api/heatmap?page_url=<url>` | Fetch click coordinates for a page |
| `GET` | `/api/heatmap/pages` | List all pages that have click data |
| `GET` | `/tracker.js` | Serves the embeddable tracking script |
| `GET` | `/health` | Health check endpoint |

**Event payload schema:**
```json
{
  "session_id": "sess_abc123_xyz",
  "event_type": "click",
  "page_url": "https://example.com/",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "x": 450,
  "y": 320,
  "viewport_width": 1440,
  "viewport_height": 900,
  "user_agent": "Mozilla/5.0 ...",
  "timezone": "Asia/Kolkata",
  "referrer": "https://google.com"
}
```

---

### 3. Database (MongoDB)

Events are stored in a single `events` collection with a structured Mongoose schema and compound indexes optimized for the two primary query patterns:

```javascript
// Optimized for heatmap queries (page_url + event_type filter)
eventSchema.index({ page_url: 1, event_type: 1 });

// Optimized for session timeline queries (sorted by time, descending)
eventSchema.index({ session_id: 1, timestamp: -1 });
```

---

### 4. Dashboard (React / Vite)

#### Sessions View
- Displays all sessions in a live list (auto-refreshes every 30 seconds)
- Each session row shows: Session ID, total events, traffic source (Direct / Referral), time, and timezone city
- Clicking a session opens a detailed **event journey timeline** on the right panel
- Timeline sorted newest-first (descending) with event type and page path

#### Heatmap View
- Dropdown to select any tracked page URL
- Canvas-based heatmap rendering click density with color coding:
  - 🔵 Blue — low density
  - 🟠 Orange — medium density
  - 🔴 Red — high density hotspot
- Stat cards showing: pages tracked, clicks on page, unique sessions

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your MONGODB_URI
npm run dev            # starts with nodemon on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # dashboard on http://localhost:5173
```

### 3. Demo Page

Simply open `demo/index.html` in your browser.  
The tracker loads from the production backend URL, so events are sent live.

### 4. Run Tests

```bash
cd backend
npm test               # 8 passing tests (Jest + Supertest, no MongoDB required)
```

---

## Deployment

| Service | Platform | Purpose |
|---|---|---|
| Database | MongoDB Atlas (M0 Free) | Managed MongoDB cloud database |
| Backend | Render (Free) | Node.js API hosting |
| Frontend | Vercel (Free) | React dashboard hosting |

### Environment Variables

**Backend (Render):**
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/causalfunnel
FRONTEND_URL=https://your-app.vercel.app
API_KEY=your_secret_key_here
PORT=5000
```

**Frontend (Vercel):**
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_API_KEY=your_secret_key_here
```

---

## Project Structure

```
CausalFunnel_Assignment/
├── backend/
│   ├── app.js                          # Express app (middleware, routes, error handlers)
│   ├── server.js                       # Entry point — connects MongoDB, starts server
│   ├── .env.example                    # Environment variable template
│   ├── tests/events.test.js            # Jest + Supertest tests (8 tests)
│   └── src/
│       ├── middleware/auth.js          # Optional x-api-key auth middleware
│       ├── models/Event.js             # Mongoose schema with indexes
│       ├── routes/events.js            # API route definitions
│       └── controllers/eventController.js  # Business logic & DB queries
│
├── frontend/
│   ├── vite.config.js                  # Vite + /api proxy for local dev
│   └── src/
│       ├── App.jsx                     # Root layout + top navigation
│       ├── index.css                   # Global design system / tokens
│       └── features/analytics/
│           ├── service/api.js          # All fetch calls (analyticsApi)
│           ├── hooks/
│           │   ├── useSessions.js      # useSessions (30s auto-refresh), useSessionEvents
│           │   └── useHeatmap.js       # useHeatmapPages, useHeatmap
│           └── ui/
│               ├── SessionsView.jsx    # Sessions list + event journey panel
│               └── HeatmapView.jsx     # Canvas heatmap + controls
│
├── tracker/tracker.js                  # Embeddable analytics tracking script
├── demo/index.html                     # Demo e-commerce page (ShopEase)
└── README.md
```

---

## Assumptions & Trade-offs

| Decision | Rationale |
|---|---|
| **Single `events` collection** | Simplifies ingestion; aggregation handles session grouping at read time |
| **Event batching (2s intervals)** | Reduces HTTP requests; acceptable latency for analytics use case |
| **`localStorage` for session ID** | Persists across page refreshes; fits assignment scope better than cookies |
| **Canvas-based heatmap** | Far more performant than DOM elements for rendering hundreds of click points |
| **`POST /events` is public (no auth)** | Tracker is a public pixel — same pattern as Google Analytics, Mixpanel |
| **Optional `x-api-key` auth** | Dashboard read endpoints are protected when `API_KEY` is set in env |
| **`app.js` / `server.js` split** | `app.js` is importable without starting MongoDB — enables clean unit tests |
| **Features-based frontend architecture** | `hooks / service / ui` per domain — scales cleanly, mirrors real codebases |
| **Relative coordinates stored** | `x/y` stored alongside `viewport_width/height` for cross-screen normalization |
| **No IP geolocation** | Avoided 3rd-party API dependency; timezone captured client-side instead |
| **AbortController in hooks** | Prevents memory leaks if a component unmounts mid-fetch |

---

## Future Improvements

- [ ] WebSocket-based real-time event streaming (no polling)
- [ ] Session replay — record and replay full user interactions
- [ ] Funnel analysis and conversion tracking
- [ ] Time range filters on the dashboard
- [ ] Multi-tenant support with authentication
- [ ] Docker Compose for one-command local setup
- [ ] Export session data as CSV
