# Meridian ELD

**Trip Planner & Compliance Monitor for truck drivers**

A full-stack web app that takes a driver's route details and generates a compliant ELD trip plan — including a visual 24-hour logbook, required rest/fuel stops, and an interactive map — all validated against FMCSA HOS regulations.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS + custom CSS design system |
| Maps | Leaflet / React-Leaflet |
| HTTP client | Axios |
| Backend | FastAPI (Python) |
| Routing | OpenRouteService or OSRM (pluggable) |

---

## Project Structure

```
/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Main application + ELD log sheet
│   │   ├── MapView.tsx          # Leaflet map component
│   │   └── main.tsx
│   ├── public/
│   ├── logistics-design-system.css   # Meridian design tokens + components
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── main.py                  # FastAPI entry point
    ├── routers/
    │   └── trip.py              # /api/plan-trip/ endpoint
    ├── services/
    │   ├── routing.py           # Distance/geometry calculation
    │   ├── hos.py               # HOS rules engine
    │   └── log_builder.py       # ELD log entry generator
    └── requirements.txt
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- pip

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`.

---

## API

### `POST /api/plan-trip/`

Plans a trip and returns a route, ELD logs, and required stops.

**Request body**

```json
{
  "currentLocation": "Chicago, IL",
  "pickupLocation":  "Indianapolis, IN",
  "dropoffLocation": "Nashville, TN",
  "cycleUsed": 14
}
```

`cycleUsed` is the number of hours already used in the driver's current 70hr/8-day cycle.

**Response**

```json
{
  "route": {
    "distance_miles": 482.3,
    "duration_hours": 7.8,
    "geometry": [[lat, lng], ...]
  },
  "logs": [
    {
      "day": 1,
      "entries": [
        { "start": 0,  "end": 1,  "status": "OFF"     },
        { "start": 1,  "end": 9,  "status": "SB"      },
        { "start": 9,  "end": 19, "status": "DRIVING" },
        { "start": 19, "end": 24, "status": "OFF"     }
      ]
    }
  ],
  "stops": [
    { "type": "FUEL",    "day": 1 },
    { "type": "REST",    "day": 1 },
    { "type": "DROPOFF", "day": 2 }
  ]
}
```

**Log entry statuses**

| Value | Meaning |
|---|---|
| `OFF` | Off duty |
| `SB` | Sleeper berth |
| `DRIVING` | Driving |
| `ON_DUTY` | On duty, not driving |

---

## HOS Rules Applied

The backend enforces FMCSA property-carrying driver regulations:

- **11-hour driving limit** — no more than 11 hours driving after 10 consecutive off-duty hours
- **14-hour on-duty window** — cannot drive beyond 14 hours after coming on duty
- **30-minute break** — required after 8 cumulative hours of driving
- **70-hour/8-day cycle** — off duty once 70 hours on duty in 8 days; reset requires 34 consecutive off-duty hours
- **10-hour rest** — minimum 10 consecutive hours off duty between shifts

Sleeper berth splits (8/2 or 7/3) are supported where applicable.

---

## Design System

The UI uses the **Meridian design system** (`logistics-design-system.css`), a dark-first industrial theme built around:

- `--amber` (`#f59e0b`) — primary brand accent
- `--surface-1/2/3` — layered dark navy surfaces
- `Syne` — display headings
- `Instrument Sans` — UI body text  
- `DM Mono` — data labels, IDs, tracking codes

Light mode is supported automatically via `@media (prefers-color-scheme: light)`.

Key component classes: `.logi-card`, `.kpi-card`, `.logi-btn`, `.logi-input`, `.badge`, `.status-dot`, `.logi-progress`.

---

## Environment Variables

Create a `.env` file in `backend/` for any routing API keys:

```
ROUTING_API_KEY=your_key_here
ROUTING_PROVIDER=openrouteservice   # or "osrm"
```

---

## License

MIT
