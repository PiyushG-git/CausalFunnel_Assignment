# CausalFunnel — User Analytics Application

> A full-stack user analytics platform with real-time session tracking, event recording, and an interactive dashboard featuring sessions view and click heatmaps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js · Express.js · Mongoose |
| **Database** | MongoDB |
| **Frontend** | React · Vite |
| **Tracking Script** | Vanilla JavaScript (zero dependencies) |
| **Demo Page** | Plain HTML |

---

## Project Structure

```
CausalFunnel_Assignment/
├── .gitignore                        # OS & editor patterns (global)
│
├── backend/
│   ├── .gitignore                    # node_modules/, .env, *.log
│   ├── app.js                        # Express app: middleware, routes, error handlers
│   ├── server.js                     # Entry point: DB connect → HTTP listen
│   ├── .env                          # Environment config (git-ignored)
│   ├── .env.example                  # Template for env vars (committed)
│   └── src/
│       ├── models/Event.js           # Mongoose schema
│       ├── routes/events.js          # API route definitions
│       └── controllers/
│           └── eventController.js   # Business logic & DB queries
│
├── frontend/
│   ├── .gitignore                    # node_modules/, dist/, .vite/
│   ├── index.html
│   ├── vite.config.js                # Vite + proxy /api → localhost:5000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                   # Root layout + sidebar navigation
│       ├── index.css                 # Global design system / tokens
│       └── features/
│           └── analytics/
│               ├── service/
│               │   └── api.js        # All fetch calls (analyticsApi)
│               ├── hooks/
│               │   ├── useSessions.js    # useSessions, useSessionEvents
│               │   └── useHeatmap.js     # useHeatmapPages, useHeatmap
│               └── ui/
│                   ├── SessionsView.jsx  # Sessions table + event journey
│                   └── HeatmapView.jsx   # Click heatmap (canvas)
│
├── tracker/
│   └── tracker.js                    # Embeddable analytics script
├── demo/
│   └── index.html                    # Demo e-commerce test page
└── README.md
```

---

## Setup & Running

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`

---

### 1. Backend

```bash
cd backend
npm install
npm start
# Server → http://localhost:5000
```

For development with hot-reload:
```bash
npm run dev
```

---

### 2. Frontend (Dashboard)

```bash
cd frontend
npm install
npm run dev
# Dashboard → http://localhost:5173
```

---

### 3. Demo Page

> ⚠️ **Important:** Serve from the **project root** (not the `demo/` folder).
> The tracker script uses a relative path `../tracker/tracker.js` which must resolve correctly.

```bash
# From project root:
npx serve . -p 3000
# Then open: http://localhost:3000/demo/index.html
```

> **Note:** The tracker sends events to `http://localhost:5000/api/events`. Start the backend first.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/events` | Ingest events (single or array) |
| `GET` | `/api/sessions` | List all sessions with stats |
| `GET` | `/api/sessions/:id/events` | Event journey for a session |
| `GET` | `/api/heatmap?page_url=<url>` | Click coordinates for a page |
| `GET` | `/api/heatmap/pages` | All pages with click data |
| `GET` | `/health` | Health check |

### Event Payload Schema

```json
{
  "session_id": "sess_abc123_xyz",
  "event_type": "click",
  "page_url": "http://localhost:3000/demo/index.html",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "x": 450,
  "y": 320,
  "viewport_width": 1440,
  "viewport_height": 900,
  "user_agent": "Mozilla/5.0 ..."
}
```

---

## Data Pipeline

```
Demo Page (demo/index.html)
  └── tracker.js          POST http://localhost:5000/api/events
        └── backend/app.js  → routes/events.js → eventController.js → MongoDB

Dashboard (localhost:5173)
  └── features/analytics/
        ├── service/api.js     fetch('/api/...')  [proxied by Vite]
        ├── hooks/             useSessions / useHeatmap
        └── ui/                SessionsView / HeatmapView
              └── Vite proxy   /api → http://localhost:5000
                    └── backend/app.js → routes → controller → MongoDB
```

---

## Dashboard Features

### Sessions View
- Summary stats: total sessions, events, clicks, avg events/session
- Table showing all sessions sorted by most recent
- Clicking a row opens an animated **event timeline** (user journey)

### Heatmap View
- Dropdown to select any tracked page URL
- **Canvas-based heatmap** with density coloring:
  - 🔵 Blue = low density
  - 🟠 Orange = medium density
  - 🔴 Red = high density (hotspot)
- Recent clicks data table with coordinates and session info

---

## Tracking Script Usage

Add to any webpage:

```html
<script
  src="path/to/tracker.js"
  data-endpoint="http://localhost:5000/api/events">
</script>
```

### What it tracks:
- **`page_view`** — fired on page load and SPA navigation
- **`click`** — every user click with x/y coordinates + viewport size

### Session Management:
- Session ID stored in `localStorage` (`cf_session_id`)
- Events batched and sent every 2 seconds in chunks of 20
- Flush on tab close / visibility change via `keepalive` fetch

---

## Assumptions & Trade-offs

| Decision | Rationale |
|---|---|
| **Event batching (2s)** | Reduces network requests; slight delay acceptable for analytics |
| **`localStorage` for session** | Persists across page refreshes; tab-scoped |
| **Canvas heatmap** | More performant than DOM-heavy alternatives for many points |
| **No auth on API** | Simplified for assignment scope |
| **CORS open** | Allows any origin to track; restrict in production |
| **Relative coordinates stored** | Store `x/y` with `viewport_width/height` to normalize across screen sizes |
| **Features architecture** | Co-locates hooks, services, UI per domain — scales cleanly |
| **app.js / server.js split** | `app.js` is testable without starting DB; `server.js` only boots |

---

## Future Improvements

- [ ] WebSocket-based live event streaming
- [ ] Session replay (record and replay user actions)
- [ ] Funnel analysis (conversion tracking)
- [ ] Authentication + multi-tenant support
- [ ] Time range filters on dashboard
- [ ] Export data as CSV
- [ ] Docker Compose for backend + MongoDB
