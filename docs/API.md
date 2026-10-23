# LakeClean Mission Control — API Reference

The backend API is served by FastAPI on `http://localhost:8000/api` with interactive Swagger documentation available at `http://localhost:8000/docs`.

---

## 1. System & Dashboard

### `GET /api/health`
Returns system status, active operating mode, and persistence type.
- **Response:**
  ```json
  {
    "status": "online",
    "service": "LakeClean Mission Control",
    "mode": "Demo Mode (Synthetic Simulation)",
    "timestamp": "2026-10-12T16:00:00Z",
    "database": "SQLite (Local Fallback)"
  }
  ```

### `GET /api/dashboard/summary`
Returns operational metrics and active lake coordinates.
- **Response:**
  ```json
  {
    "total_waste_hotspots": 6,
    "high_priority_zones": 3,
    "missions_completed": 1,
    "missions_running": 0,
    "estimated_waste_collected_kg": 14.0,
    "average_completion_rate_pct": 50.0,
    "simulated_battery_level_pct": 100.0,
    "simulated_bin_capacity_pct": 0.0,
    "active_water_body": {
      "id": "lake-austin-basin-demo",
      "name": "Lady Bird Urban Lake (Demo Basin)",
      "launch_point_lat": 30.2540,
      "launch_point_lng": -97.7495
    },
    "mode": "Demo Mode (Synthetic Data)"
  }
  ```

### `GET /api/dashboard/activity`
Returns the 5 most recent missions, waste reports, priority zones, and telemetry events.

---

## 2. Water Bodies & Zones

### `GET /api/lakes`
List all registered lake basins.

### `GET /api/lakes/{lake_id}`
Retrieve details for a specific lake.

### `GET /api/lakes/{lake_id}/zones`
Retrieve all cleaning zones for a specific lake basin.

### `GET /api/zones`
List all zones with optional `?water_body_id=` query filter.

### `POST /api/zones`
Create a new cleaning zone and automatically compute its explainable priority score.

### `PATCH /api/zones/{zone_id}`
Update zone properties (severity, density, runoff, restriction) and recalculate priority score.

---

## 3. Waste Reports

### `GET /api/reports`
Filterable waste reports list.
- **Query Parameters:** `category`, `severity`, `report_status`, `search`

### `POST /api/reports`
Register a new waste report.
- **Request Body:**
  ```json
  {
    "water_body_id": "lake-austin-basin-demo",
    "zone_id": "zone-north-inflow",
    "title": "Accumulation of PET bottles near storm culvert",
    "category": "Plastic bottles",
    "severity": "CRITICAL",
    "estimated_density": 85.0,
    "latitude": 30.2608,
    "longitude": -97.7442,
    "description": "Cluster of roughly 40-50 clear beverage bottles."
  }
  ```

### `PATCH /api/reports/{report_id}/verification`
Verify or reject a report (`{"verification_status": "VERIFIED"}`).

---

## 4. Mission Planning & Simulation

### `POST /api/missions/plan`
Generates a candidate cleaning route and performs pre-flight feasibility checks without creating a persistent record.
- **Request Body:**
  ```json
  {
    "water_body_id": "lake-austin-basin-demo",
    "mission_name": "Test Operation Alpha",
    "selected_zone_ids": ["zone-marina-bay", "zone-south-park"],
    "initial_battery_pct": 100.0,
    "initial_bin_fill_pct": 0.0,
    "battery_reserve_pct": 20.0,
    "max_bin_capacity_kg": 40.0,
    "boat_speed_kmh": 4.5,
    "cleaning_time_per_zone_mins": 12.0
  }
  ```
- **Response:** `FeasibilityReport` with `is_feasible`, `violations`, `waypoints`, and expected resource margins.

### `POST /api/missions`
Saves an approved mission plan.

### `POST /api/missions/{mission_id}/start`
Initiates autonomous mission execution.

### `POST /api/missions/{mission_id}/pause`
Pauses execution.

### `POST /api/missions/{mission_id}/resume`
Resumes execution.

### `POST /api/missions/{mission_id}/abort`
Safely aborts execution.

### `POST /api/missions/{mission_id}/tick`
Advances the simulated boat by one waypoint, updates battery drain, and generates cleaning telemetry.

### `GET /api/missions/{mission_id}/events`
Returns timeline event log for a mission.

---

## 5. Analytics

### `GET /api/analytics/overview`
Aggregated dataset containing status distributions, waste category breakdowns, and total distance/waste metrics.
