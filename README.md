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
├── backend/
│   ├── server.js                   # Express entry point
│   ├── .env                        # Environment config
│   └── src/
│       ├── models/Event.js         # Mongoose schema
│       ├── routes/events.js        # API routes
│       └── controllers/
│           └── eventController.js  # Business logic
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # Root app + navigation
│       ├── api.js                  # API client
│       ├── index.css               # Global design system
│       └── components/
│           ├── SessionsView.jsx    # Sessions table + event journey
│           └── HeatmapView.jsx     # Click heatmap (canvas)
├── tracker/
│   └── tracker.js                  # Embeddable analytics script
├── demo/
│   └── index.html                  # Demo e-commerce test page
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

Open `demo/index.html` directly in a browser (or serve it with a local server).

```bash
# From project root — using npx serve or similar
npx serve demo -p 3000
# Open http://localhost:3000
```

> **Note:** The tracker in the demo page sends events to `http://localhost:5000/api/events`. Make sure the backend is running first.

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
  "page_url": "http://localhost:3000/",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "x": 450,
  "y": 320,
  "viewport_width": 1440,
  "viewport_height": 900,
  "user_agent": "Mozilla/5.0 ..."
}
```

---

## Dashboard Features

### Sessions View
- Summary stats: total sessions, events, clicks, avg events/session
- Table showing all sessions sorted by most recent
- Clicking a row opens an animated **event timeline** (user journey) showing all events in chronological order

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

Or configure programmatically:

```html
<script>
  window.CF_TRACKER_ENDPOINT = 'http://localhost:5000/api/events';
</script>
<script src="tracker.js"></script>
```

### What it tracks:
- **`page_view`** — fired on page load and SPA navigation
- **`click`** — every user click with x/y coordinates + viewport size

### Session Management:
- Session ID is stored in `localStorage` with key `cf_session_id`
- Events are batched and sent every 2 seconds
- Flush on tab close / visibility change via `keepalive` fetch

---

## Assumptions & Trade-offs

| Decision | Rationale |
|---|---|
| **Event batching (2s)** | Reduces network requests; slight delay acceptable for analytics |
| **`localStorage` for session** | Persists across page refreshes; tab-scoped. Cookies would survive clears better |
| **Canvas heatmap** | More performant than DOM-heavy alternatives for many points |
| **No auth on API** | Simplified for assignment scope; production would add API key auth |
| **CORS open** | Allows any origin to track; restrict to specific domains in production |
| **Relative coordinates stored** | Store `x/y` with `viewport_width/height` to normalize across screen sizes |
| **No real-time push** | Dashboard uses manual refresh; WebSockets could be added for live updates |

---

## Future Improvements

- [ ] WebSocket-based live event streaming
- [ ] Session replay (record and replay user actions)
- [ ] Funnel analysis (conversion tracking)
- [ ] Authentication + multi-tenant support
- [ ] Time range filters on dashboard
- [ ] Export data as CSV
- [ ] Deployment: Docker Compose for backend + MongoDB
