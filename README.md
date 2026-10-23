# LakeClean Mission Control

> **Evidence-Driven, Capacity-Aware Adaptive Mission Planning and Simulation Platform for Lake Water Cleaning**

LakeClean Mission Control is a professional full-stack environmental operations dashboard designed to coordinate, optimize, and simulate autonomous trash-collection and water-purification missions in urban lakes and reservoirs.

---

## 1. Problem Statement

Urban lakes, park lagoons, and municipal stormwater reservoirs continuously accumulate floating plastics, snack packaging, polystyrene, and organic debris. Cleanup teams frequently lack the tools to:
- Identify high-priority pollution hotspots based on physical severity and stormwater runoff exposure.
- Calculate deterministic, capacity-aware routes that guarantee the boat returns to dock before its battery drains below safety reserves.
- Account for physical collection-bin weight capacity before departure.
- Monitor telemetry progress and document verified cleanup records.

**LakeClean Mission Control** provides a closed-loop platform that evaluates environmental risk, optimizes cleaning routes, enforces safety feasibility constraints, and simulates autonomous execution with zero external paid APIs or physical hardware required.

---

## 2. Key Features

- **Interactive Geospatial Lake Map:** Built with Leaflet and OpenStreetMap. Visualizes demonstration lake boundaries, cleaning sectors color-coded by priority, waste reports, restricted wildlife sanctuaries, route waypoints, and animated boat markers.
- **Explainable Priority Scoring:** Calculates transparent risk scores ($0–100$) combining waste severity ($35\%$), waste density ($25\%$), observation freshness ($20\%$), and stormwater runoff exposure ($20\%$).
- **Capacity-Aware Route Planner:** Deterministic priority-weighted TSP heuristic in Python that plans departure, approach waypoints, cleaning sweeps, and dock return.
- **Pre-Flight Feasibility Guard:** Validates battery reserves (e.g. $20\%$ minimum reserve margin), maximum collection-bin capacity (e.g. $40\,\text{kg}$), and no-entry restricted sanctuaries.
- **Live Mission Simulation Engine:** Software state machine (`PLANNED` -> `RUNNING` <-> `PAUSED` -> `COMPLETED` / `ABORTED`) with real-time waypoint progression, battery drain, bin fill updates, and persistent telemetry events.
- **Waste Reports Registry:** Citizen science and drone scout reporting interface with categories, severity ratings, geospatial coordinates, and verification triage.
- **Flight Logs & Historical Archive:** Chronological timeline of missions with distance, duration, battery consumption, and CSV export.
- **Recharts Environmental Analytics:** Rich categorical waste distributions, sector risk stratification, and coverage progress.
- **Dual Persistence:** Automatic local SQLite development fallback with zero setup, with turnkey Supabase PostgreSQL schema migration ready for production.
- **Strict JavaScript Frontend:** Built using pure JavaScript and JSX (`.js`, `.jsx`). Zero TypeScript files.

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** JavaScript & JSX only (No TypeScript)
- **Styling:** Tailwind CSS (Custom dark environmental palette)
- **Mapping:** Leaflet & React Leaflet (SSR-safe dynamic import)
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.14 compatible)
- **Validation:** Pydantic v2
- **ORM / Database:** SQLAlchemy 2.0 (SQLite local fallback, Supabase PostgreSQL production ready)
- **Testing:** Pytest & HTTPX TestClient

---

## 4. Folder Structure

```text
lakeclean-mission-control/
├── frontend/                     # Next.js App Router (Pure JavaScript/JSX)
│   ├── app/
│   │   ├── layout.js             # Root shell with persistent navigation
│   │   ├── page.js               # Mission Operations Dashboard
│   │   ├── globals.css           # Tailwind CSS & Leaflet map overrides
│   │   ├── map/page.js           # Interactive Geospatial Lake Map
│   │   ├── missions/page.js      # Autonomous Mission Planner & Feasibility
│   │   ├── simulation/page.js    # Live Simulation Engine & Telemetry
│   │   ├── reports/page.js       # Waste Reports Registry & Verification
│   │   ├── history/page.js       # Mission Archive & Flight Logs
│   │   ├── analytics/page.js     # Environmental Analytics & CSV Export
│   │   └── settings/page.js      # Settings, Methodology & Data Provenance
│   ├── components/
│   │   ├── layout/               # Sidebar & Header
│   │   ├── map/                  # Dynamic Leaflet Map components
│   │   └── ui/                   # Badge, StatCard, Modal
│   ├── lib/
│   │   ├── api.js                # Frontend API client module
│   │   └── formatters.js         # Distance, duration, date formatters
│   └── package.json
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── main.py               # FastAPI entry point & lifespan handler
│   │   ├── api/routes/           # Route handlers (dashboard, lakes, missions...)
│   │   ├── core/config.py        # Settings & database URL resolution
│   │   ├── db/                   # SQLAlchemy session & seed dataset
│   │   ├── models/models.py      # SQLAlchemy relational models
│   │   ├── schemas/schemas.py    # Pydantic schemas
│   │   └── services/             # Scoring, Route Planner, Feasibility, Simulator
│   ├── tests/                    # Pytest test suite (22 unit & integration tests)
│   └── requirements.txt
├── supabase/
│   └── migrations/               # PostgreSQL schema migration
├── docs/
│   ├── ARCHITECTURE.md           # System architecture & component design
│   ├── API.md                    # REST API endpoint reference
│   ├── METHODOLOGY.md            # Mathematical formulas & algorithms
│   └── PATENT_PRIOR_ART.md       # Preliminary prior-art & differentiation log
├── .gitignore
├── .env.example
└── README.md
```

---

## 5. Local Setup Instructions

### Prerequisites
- **Python:** 3.10+ (tested on Python 3.14)
- **Node.js:** v18+ (tested on Node v24)
- **Git**

---

### Step 1: Backend Setup (Terminal 1)

#### Windows (PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

> **PowerShell Script Execution Policy Tip:** If Windows blocks script activation (`Execution_Policies`), launch uvicorn directly with python without changing execution policy:
> ```powershell
> .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
> ```

#### macOS / Linux
```bash
## 5. Quick Start (Local Development)

### Step 1: Backend Setup (Terminal 1)

From the project root:
```powershell
# Activate Python virtual environment
.\.venv\Scripts\Activate.ps1

# Run the FastAPI server
python -m uvicorn backend.app.main:app --reload --port 8000
```

The FastAPI backend will start at:
- **API Base:** [http://localhost:8000/api](http://localhost:8000/api)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

*Note:* On initial startup, the backend automatically creates `lakeclean.db` SQLite database and seeds the demonstration dataset.

---

### Step 2: Create the Initial Administrator Account

To safely configure your administrator account without committing secrets or publishing passwords:

```powershell
# From project root:
python -m backend.scripts.create_admin --email admin@lakeclean.demo --password "YourStrongPassword2026!" --name "Chief Administrator"
```

Alternatively, you can define environment variables in `backend/.env`:
```env
INITIAL_ADMIN_EMAIL=admin@lakeclean.demo
INITIAL_ADMIN_PASSWORD=YourStrongPassword2026!
INITIAL_ADMIN_NAME="Chief Administrator"
```
The server will safely provision the admin on first startup without resetting or overwriting passwords on subsequent boots.

---

### Step 3: Frontend Setup (Terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

The Next.js frontend will start at:
- **Mission Control Web App:** [http://localhost:3000](http://localhost:3000)
- **Direct Login Portal:** [http://localhost:3000/login](http://localhost:3000/login)

---

## 6. User Roles and Access Control

| Role | Permissions & Scope | Access Level |
| :--- | :--- | :--- |
| **Administrator** | Access admin dashboard, manage user accounts & roles, promote/demote specialists, manage cleaning sectors, review/delete waste reports, view all analytics. | Full Access |
| **Operator / Researcher** | Access operations dashboard, lake map, waste reports verification, route planner, simulation engine, mission logs, and analytics. | Standard Access |
| **Guest Explorer** | 1-click access without credentials. Explore interactive maps, plan cleanup sweeps, run autonomous boat simulations with simulated demo data. Cannot triage reports or access admin management. | Guest Demo Mode |

*Permissions are enforced on the backend via JWT role dependencies and database checks, not just frontend conditional UI.*

---

## 7. Running Tests

### Backend Automated Test Suite
From the root directory:
```powershell
.\.venv\Scripts\python.exe -m pytest -v backend/tests
```
Runs 28 automated tests covering:
- Correct and incorrect credential login verification
- Registration with default operator role (privilege escalation prevention)
- Instant guest token generation and role isolation
- Administrator route protection (guests and operators receive 403 Forbidden on `/api/admin/users`)
- Administrator user promotion and status toggles
- Single-use password reset workflow
- API health and summary endpoints
- Explainable priority scoring calculations ($0.35 \times \text{Sev} + 0.25 \times \text{Den} + 0.20 \times \text{Fresh} + 0.20 \times \text{Runoff}$)
- Deterministic route generation and Haversine distance
- Battery reserve constraint enforcement ($\ge 20\%$)
- Collection bin capacity overflow enforcement ($40\,\text{kg}$)
- Restricted sanctuary avoidance
- Simulation state machine lifecycle (`start`, `pause`, `resume`, `abort`, `tick`)
- Waste report CRUD, verification triage, and deletion

### Frontend Production Build
From `frontend/`:
```powershell
npm run build
```
Validates static page generation and code correctness (zero TypeScript files, pure JavaScript and JSX).

---

## 8. Supabase Production Database Setup

When deploying with Supabase PostgreSQL:
1. Create a project on [supabase.com](https://supabase.com).
2. Go to the SQL Editor in Supabase and run:
   - `supabase/migrations/20261012_initial_schema.sql` (Tables & geospatial schemas)
   - `supabase/migrations/20261013_auth_and_roles.sql` (Profiles trigger, RLS policies, role guards)
3. Set the `DATABASE_URL` environment variable:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Restart the backend. The service will connect directly to Supabase with Row Level Security enabled.

---

## 9. Data Provenance & Synthetic Disclaimer

All lake bathymetry polygons, waste coordinates, and boat battery figures displayed in this application are **synthetic simulation models** created for academic validation. Do not interpret simulated values as measured environmental toxicology data.

