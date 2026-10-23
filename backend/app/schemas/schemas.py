from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# Base Schemas
class WaterBodyBase(BaseModel):
    name: str
    description: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    launch_point_lat: float
    launch_point_lng: float
    data_source: Optional[str] = "synthetic_demo"

class WaterBodyCreate(WaterBodyBase):
    pass

class WaterBodyResponse(WaterBodyBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Zone Schemas
class ZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    geometry_geojson: Dict[str, Any]
    severity_score: float = Field(default=50.0, ge=0, le=100)
    waste_density_score: float = Field(default=50.0, ge=0, le=100)
    runoff_exposure_score: float = Field(default=30.0, ge=0, le=100)
    priority_score: Optional[float] = None
    is_restricted: bool = False
    data_source: Optional[str] = "synthetic_demo"

class ZoneCreate(ZoneBase):
    water_body_id: str

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity_score: Optional[float] = Field(default=None, ge=0, le=100)
    waste_density_score: Optional[float] = Field(default=None, ge=0, le=100)
    runoff_exposure_score: Optional[float] = Field(default=None, ge=0, le=100)
    is_restricted: Optional[bool] = None

class ZoneResponse(ZoneBase):
    id: str
    water_body_id: str
    priority_score: float
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Waste Report Schemas
class WasteReportBase(BaseModel):
    title: str
    category: str
    severity: str = "MEDIUM"
    estimated_density: float = Field(default=40.0, ge=0, le=100)
    latitude: float
    longitude: float
    description: Optional[str] = None
    observed_at: Optional[datetime] = None
    verification_status: str = "UNVERIFIED"
    report_status: str = "OPEN"
    photo_url: Optional[str] = None
    data_source: Optional[str] = "synthetic_demo"

class WasteReportCreate(WasteReportBase):
    water_body_id: str
    zone_id: Optional[str] = None

class WasteReportUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    estimated_density: Optional[float] = None
    description: Optional[str] = None
    verification_status: Optional[str] = None
    report_status: Optional[str] = None

class WasteReportResponse(WasteReportBase):
    id: str
    water_body_id: str
    zone_id: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Mission Planning & Feasibility Schemas
class MissionPlanRequest(BaseModel):
    water_body_id: str
    mission_name: str
    selected_zone_ids: List[str]
    initial_battery_pct: float = Field(default=100.0, ge=10, le=100)
    initial_bin_fill_pct: float = Field(default=0.0, ge=0, le=95)
    battery_reserve_pct: float = Field(default=20.0, ge=5, le=50)
    max_bin_capacity_kg: float = Field(default=40.0, gt=0)
    boat_speed_kmh: float = Field(default=4.5, gt=0)
    cleaning_time_per_zone_mins: float = Field(default=12.0, ge=1)
    drain_per_km_pct: float = Field(default=12.0, ge=1)
    drain_per_zone_pct: float = Field(default=4.0, ge=0)

class ConstraintViolation(BaseModel):
    constraint_name: str
    message: str
    suggested_action: str

class FeasibilityReport(BaseModel):
    is_feasible: bool
    status: str
    violations: List[ConstraintViolation] = []
    total_distance_km: float
    travel_time_minutes: float
    cleaning_time_minutes: float
    total_duration_minutes: float
    battery_required_travel_pct: float
    battery_required_cleaning_pct: float
    total_battery_drain_pct: float
    final_battery_pct: float
    estimated_collected_waste_kg: float
    final_bin_fill_pct: float
    projected_bin_fill_pct: Optional[float] = None
    waypoints: List[Dict[str, Any]]
    ordered_zone_ids: List[str]
    route_geojson: Optional[Dict[str, Any]] = None
    notes: List[str] = []

class MissionCreate(BaseModel):
    water_body_id: str
    name: str
    selected_zone_ids: List[str]
    planned_route_geojson: Dict[str, Any]
    planned_distance_km: float
    estimated_duration_minutes: float
    initial_battery_pct: float
    initial_bin_fill_pct: float
    estimated_final_battery_pct: float
    estimated_final_bin_fill_pct: float
    feasibility_status: str
    planning_summary: Dict[str, Any]

class MissionResponse(BaseModel):
    id: str
    water_body_id: str
    name: str
    status: str
    selected_zone_ids: List[str]
    planned_route_geojson: Optional[Dict[str, Any]] = None
    planned_distance_km: float
    estimated_duration_minutes: float
    initial_battery_pct: float
    initial_bin_fill_pct: float
    estimated_final_battery_pct: float
    estimated_final_bin_fill_pct: float
    feasibility_status: str
    planning_summary: Dict[str, Any]
    data_source: str
    created_by: str
    current_waypoint_index: int
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    current_battery_pct: float
    current_bin_fill_pct: float
    completed_zone_ids: List[str]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# Telemetry and Events
class TelemetryEventResponse(BaseModel):
    id: str
    mission_id: str
    latitude: float
    longitude: float
    battery_pct: float
    bin_fill_pct: float
    mission_status: str
    event_type: str
    event_message: Optional[str] = None
    data_source: str
    recorded_at: datetime
    class Config:
        from_attributes = True

class MissionEventResponse(BaseModel):
    id: str
    mission_id: str
    event_type: str
    message: str
    metadata_json: Dict[str, Any]
    created_at: datetime
    class Config:
        from_attributes = True

# Simulation Controls
class SimulationTickResponse(BaseModel):
    mission_id: str
    status: str
    current_waypoint_index: int
    total_waypoints: int
    current_lat: float
    current_lng: float
    current_battery_pct: float
    current_bin_fill_pct: float
    completed_zone_ids: List[str]
    events_triggered: List[str]
    is_finished: bool
    status_message: str

# Dashboard & Analytics
class DashboardSummary(BaseModel):
    total_waste_hotspots: int
    high_priority_zones: int
    missions_completed: int
    missions_running: int
    estimated_waste_collected_kg: float
    average_completion_rate_pct: float
    simulated_battery_level_pct: float
    simulated_bin_capacity_pct: float
    active_water_body: Optional[Dict[str, Any]] = None
    mode: str = "Demo Mode (Synthetic Data)"

class AnalyticsOverview(BaseModel):
    missions_by_status: Dict[str, int]
    waste_by_category: Dict[str, int]
    priority_distribution: Dict[str, int]
    zones_completed_vs_incomplete: Dict[str, int]
    total_simulated_distance_km: float
    total_simulated_waste_kg: float
    recent_performance: List[Dict[str, Any]]

# Auth & User Management Schemas
class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserRoleUpdate(BaseModel):
    role: str

