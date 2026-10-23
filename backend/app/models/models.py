import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Integer, TypeDecorator
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type.
    Uses PostgreSQL's native UUID type, or String(36) on SQLite.
    Accepts str or uuid.UUID, returns str.
    """
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=False))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(190), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    display_name = Column(String(120), nullable=False)
    role = Column(String(50), default="operator")  # 'admin', 'operator', 'guest'
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(100), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    display_name = Column(String(120), nullable=False)
    role = Column(String(50), default="operator")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WaterBody(Base):
    __tablename__ = "water_bodies"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    boundary_geojson = Column(JSON, nullable=True)
    launch_point_lat = Column(Float, nullable=False)
    launch_point_lng = Column(Float, nullable=False)
    data_source = Column(String(60), default="synthetic_demo")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    zones = relationship("Zone", back_populates="water_body", cascade="all, delete-orphan")
    reports = relationship("WasteReport", back_populates="water_body")
    missions = relationship("MissionPlan", back_populates="water_body")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    water_body_id = Column(String(64), ForeignKey("water_bodies.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    geometry_geojson = Column(JSON, nullable=False)
    severity_score = Column(Float, default=50.0)
    waste_density_score = Column(Float, default=50.0)
    runoff_exposure_score = Column(Float, default=30.0)
    priority_score = Column(Float, default=45.0)
    is_restricted = Column(Boolean, default=False)
    data_source = Column(String(60), default="synthetic_demo")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    water_body = relationship("WaterBody", back_populates="zones")
    reports = relationship("WasteReport", back_populates="zone")
    cleanup_records = relationship("CleanupRecord", back_populates="zone")

class WasteReport(Base):
    __tablename__ = "waste_reports"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    water_body_id = Column(String(64), ForeignKey("water_bodies.id"), nullable=False, index=True)
    zone_id = Column(String(64), ForeignKey("zones.id"), nullable=True, index=True)
    title = Column(String(160), nullable=False)
    category = Column(String(80), nullable=False)  # e.g. Plastic bottles, Organic debris, Mixed waste
    severity = Column(String(30), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    estimated_density = Column(Float, default=40.0) # 0 - 100
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    observed_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String(30), default="UNVERIFIED") # UNVERIFIED, VERIFIED, REJECTED
    report_status = Column(String(30), default="OPEN") # OPEN, IN_PROGRESS, RESOLVED
    photo_url = Column(String(255), nullable=True)
    data_source = Column(String(60), default="synthetic_demo")
    created_by = Column(String(120), default="Operator (Demo)")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    water_body = relationship("WaterBody", back_populates="reports")
    zone = relationship("Zone", back_populates="reports")

class MissionPlan(Base):
    __tablename__ = "mission_plans"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    water_body_id = Column(String(64), ForeignKey("water_bodies.id"), nullable=False, index=True)
    name = Column(String(160), nullable=False)
    status = Column(String(30), default="PLANNED") # DRAFT, FEASIBLE, INFEASIBLE, PLANNED, RUNNING, PAUSED, COMPLETED, ABORTED
    selected_zone_ids = Column(JSON, default=list)
    planned_route_geojson = Column(JSON, nullable=True)
    planned_distance_km = Column(Float, default=0.0)
    estimated_duration_minutes = Column(Float, default=0.0)
    initial_battery_pct = Column(Float, default=100.0)
    initial_bin_fill_pct = Column(Float, default=0.0)
    estimated_final_battery_pct = Column(Float, default=80.0)
    estimated_final_bin_fill_pct = Column(Float, default=25.0)
    feasibility_status = Column(String(30), default="FEASIBLE") # FEASIBLE, INFEASIBLE
    planning_summary = Column(JSON, default=dict)
    data_source = Column(String(60), default="simulated_model")
    created_by = Column(String(120), default="Lead Operator")
    
    # Simulation runtime state
    current_waypoint_index = Column(Integer, default=0)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    current_battery_pct = Column(Float, default=100.0)
    current_bin_fill_pct = Column(Float, default=0.0)
    completed_zone_ids = Column(JSON, default=list)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    water_body = relationship("WaterBody", back_populates="missions")
    telemetry_events = relationship("TelemetryEvent", back_populates="mission", cascade="all, delete-orphan")
    mission_events = relationship("MissionEvent", back_populates="mission", cascade="all, delete-orphan")
    cleanup_records = relationship("CleanupRecord", back_populates="mission", cascade="all, delete-orphan")

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    mission_id = Column(String(64), ForeignKey("mission_plans.id"), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    battery_pct = Column(Float, nullable=False)
    bin_fill_pct = Column(Float, nullable=False)
    mission_status = Column(String(30), default="RUNNING")
    event_type = Column(String(50), default="TICK")
    event_message = Column(String(255), nullable=True)
    data_source = Column(String(60), default="simulated_telemetry")
    recorded_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("MissionPlan", back_populates="telemetry_events")

class MissionEvent(Base):
    __tablename__ = "mission_events"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    mission_id = Column(String(64), ForeignKey("mission_plans.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    message = Column(String(255), nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("MissionPlan", back_populates="mission_events")

class CleanupRecord(Base):
    __tablename__ = "cleanup_records"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    mission_id = Column(String(64), ForeignKey("mission_plans.id"), nullable=False, index=True)
    zone_id = Column(String(64), ForeignKey("zones.id"), nullable=True, index=True)
    estimated_waste_collected = Column(Float, default=0.0)
    unit = Column(String(20), default="kg")
    verification_status = Column(String(50), default="SIMULATED_VERIFIED")
    evidence_photo_url = Column(String(255), nullable=True)
    data_source = Column(String(60), default="simulated_cleanup")
    completed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("MissionPlan", back_populates="cleanup_records")
    zone = relationship("Zone", back_populates="cleanup_records")
