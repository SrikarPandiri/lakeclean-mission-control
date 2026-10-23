# LakeClean Mission Control — System Architecture

## 1. System Overview

**LakeClean Mission Control** is a browser-based environmental operations platform designed to plan, simulate, and analyze autonomous water-surface cleaning missions for urban lakes and reservoirs.

The system decouples high-level mission operations from physical boat hardware:
- **Phase 1 (Current):** High-fidelity software simulation, deterministic route optimization, and local SQLite persistence with synthetic testbeds.
- **Phase 2 (Future):** Hardware-in-the-loop and live boat connectivity via an isolated MQTT communication bridge.

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph Frontend ["Next.js (JavaScript + JSX)"]
        UI[App Shell & Responsive Navigation]
        Dash[Dashboard View]
        MapV[Leaflet Interactive Map]
        PlanV[Mission Planner & Sliders]
        SimV[Live Simulation & Telemetry]
        RepV[Waste Reports Registry]
        HistV[Flight Logs & History]
        AnV[Recharts Analytics]
        APIClient[Client API Layer / lib/api.js]
    end

    subgraph Backend ["FastAPI Backend (Python 3.14)"]
        Router[API Routers (/api)]
        ScoringSvc[Explainable Priority Scoring Service]
        PlannerSvc[Greedy Priority TSP Route Planner]
        FeasibilitySvc[Multi-Constraint Feasibility Guard]
        SimulatorSvc[State Machine Simulator & Tick Engine]
    end

    subgraph Persistence ["Relational Persistence"]
        DevDB[(Local SQLite / lakeclean.db)]
        ProdDB[(Supabase PostgreSQL)]
    end

    subgraph FutureHardware ["Future Hardware Integration Point"]
        MQTT[Isolated MQTT Broker Bridge]
        BoatHW[Physical Autonomous Skimmer Boat]
    end

    UI --> APIClient
    Dash --> APIClient
    MapV --> APIClient
    PlanV --> APIClient
    SimV --> APIClient
    RepV --> APIClient
    HistV --> APIClient
    AnV --> APIClient

    APIClient -->|HTTP/REST JSON| Router
    Router --> ScoringSvc
    Router --> PlannerSvc
    Router --> FeasibilitySvc
    Router --> SimulatorSvc

    Router --> DevDB
    Router -.->|Configured| ProdDB
    SimulatorSvc -.->|Future Bridge| MQTT --> BoatHW
```

---

## 3. Core Subsystems

### A. Frontend Layer (Next.js App Router)
- **Technology:** Pure JavaScript and JSX (`.js`, `.jsx`). No TypeScript.
- **Styling:** Tailwind CSS with an environmental palette (deep navy `#09121d`, sky blue `#0284c7`, teal `#0d9488`, off-white `#f8fafc`).
- **Geospatial Mapping:** Leaflet and React Leaflet configured for SSR-safe client execution via dynamic imports.
- **Data Visualization:** Recharts for categorical waste breakdowns, priority distributions, and mission trends.
- **Icons:** Lucide React icons.

### B. Backend Layer (FastAPI)
- **Technology:** Python 3.14, FastAPI, Pydantic v2 schemas, SQLAlchemy 2.0 ORM.
- **Stateless REST Services:** Dedicated route handlers for health, dashboard, lakes, zones, waste reports, mission planning, simulation, and analytics.
- **CORS Middleware:** Configured for local development (`localhost:3000`) and deployment origins.

### C. Algorithmic Services Layer
1. **Explainable Priority Scoring (`backend/app/services/scoring.py`):**
   $$ \text{Priority Score} = 0.35 \times \text{Severity} + 0.25 \times \text{Density} + 0.20 \times \text{Freshness} + 0.20 \times \text{Runoff} $$
   Normalized to a 0–100 scale with transparent fallback handling for missing observations.
2. **Deterministic Route Planner (`backend/app/services/route_planner.py`):**
   - Haversine geodetic distance calculation.
   - Priority-weighted greedy Traveling Salesperson heuristic.
   - Sweep waypoints within targeted cleaning sectors.
   - Mandatory return-to-dock waypoint.
3. **Multi-Constraint Feasibility Guard (`backend/app/services/feasibility.py`):**
   - Validates battery consumption against mandatory reserve threshold.
   - Validates volume against maximum collection-bin capacity.
   - Prohibits paths through restricted wildlife sanctuaries.
4. **Mission Simulator (`backend/app/services/simulator.py`):**
   - Deterministic state machine (`PLANNED` -> `RUNNING` <-> `PAUSED` -> `COMPLETED` / `ABORTED`).
   - Generates progress ticks, waypoint arrivals, battery drain, and bin fill events.
   - Stores telemetry and cleanup logs persistently.

---

## 4. Hardware Bridge Integration Plan

When the physical autonomous skimmer boat is ready:
1. An isolated MQTT client will subscribe to boat telemetry (`boat/{id}/gps`, `boat/{id}/battery`, `boat/{id}/bin`).
2. Waypoint coordinates will be dispatched via `boat/{id}/waypoints`.
3. The simulator service will switch from synthetic ticks to real telemetry events without modifying the frontend dashboard.
