-- Supabase PostgreSQL Migration for LakeClean Mission Control
-- Schema: Profiles, Water Bodies, Zones, Waste Reports, Mission Plans, Telemetry Events, Mission Events, Cleanup Records

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(120) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water bodies table
CREATE TABLE IF NOT EXISTS water_bodies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    boundary_geojson JSONB,
    launch_point_lat DOUBLE PRECISION NOT NULL,
    launch_point_lng DOUBLE PRECISION NOT NULL,
    data_source VARCHAR(60) DEFAULT 'synthetic_demo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
    id VARCHAR(64) PRIMARY KEY,
    water_body_id VARCHAR(64) REFERENCES water_bodies(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    geometry_geojson JSONB NOT NULL,
    severity_score DOUBLE PRECISION DEFAULT 50.0,
    waste_density_score DOUBLE PRECISION DEFAULT 50.0,
    runoff_exposure_score DOUBLE PRECISION DEFAULT 30.0,
    priority_score DOUBLE PRECISION DEFAULT 45.0,
    is_restricted BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(60) DEFAULT 'synthetic_demo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_water_body ON zones(water_body_id);
CREATE INDEX IF NOT EXISTS idx_zones_priority ON zones(priority_score DESC);

-- Waste reports table
CREATE TABLE IF NOT EXISTS waste_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    water_body_id VARCHAR(64) REFERENCES water_bodies(id) ON DELETE CASCADE,
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    severity VARCHAR(30) DEFAULT 'MEDIUM',
    estimated_density DOUBLE PRECISION DEFAULT 40.0,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT,
    observed_at TIMESTAMPTZ DEFAULT NOW(),
    verification_status VARCHAR(30) DEFAULT 'UNVERIFIED',
    report_status VARCHAR(30) DEFAULT 'OPEN',
    photo_url VARCHAR(255),
    data_source VARCHAR(60) DEFAULT 'synthetic_demo',
    created_by VARCHAR(120) DEFAULT 'Operator',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_water_body ON waste_reports(water_body_id);
CREATE INDEX IF NOT EXISTS idx_reports_zone ON waste_reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON waste_reports(report_status);

-- Mission plans table
CREATE TABLE IF NOT EXISTS mission_plans (
    id VARCHAR(64) PRIMARY KEY,
    water_body_id VARCHAR(64) REFERENCES water_bodies(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    status VARCHAR(30) DEFAULT 'PLANNED',
    selected_zone_ids JSONB DEFAULT '[]'::jsonb,
    planned_route_geojson JSONB,
    planned_distance_km DOUBLE PRECISION DEFAULT 0.0,
    estimated_duration_minutes DOUBLE PRECISION DEFAULT 0.0,
    initial_battery_pct DOUBLE PRECISION DEFAULT 100.0,
    initial_bin_fill_pct DOUBLE PRECISION DEFAULT 0.0,
    estimated_final_battery_pct DOUBLE PRECISION DEFAULT 80.0,
    estimated_final_bin_fill_pct DOUBLE PRECISION DEFAULT 25.0,
    feasibility_status VARCHAR(30) DEFAULT 'FEASIBLE',
    planning_summary JSONB DEFAULT '{}'::jsonb,
    data_source VARCHAR(60) DEFAULT 'simulated_model',
    created_by VARCHAR(120) DEFAULT 'Operator',
    current_waypoint_index INTEGER DEFAULT 0,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    current_battery_pct DOUBLE PRECISION DEFAULT 100.0,
    current_bin_fill_pct DOUBLE PRECISION DEFAULT 0.0,
    completed_zone_ids JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missions_status ON mission_plans(status);

-- Telemetry events table
CREATE TABLE IF NOT EXISTS telemetry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id VARCHAR(64) REFERENCES mission_plans(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    battery_pct DOUBLE PRECISION NOT NULL,
    bin_fill_pct DOUBLE PRECISION NOT NULL,
    mission_status VARCHAR(30) DEFAULT 'RUNNING',
    event_type VARCHAR(50) DEFAULT 'TICK',
    event_message VARCHAR(255),
    data_source VARCHAR(60) DEFAULT 'simulated_telemetry',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telem_mission ON telemetry_events(mission_id);

-- Mission events timeline table
CREATE TABLE IF NOT EXISTS mission_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id VARCHAR(64) REFERENCES mission_plans(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_mission ON mission_events(mission_id);

-- Cleanup records table
CREATE TABLE IF NOT EXISTS cleanup_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id VARCHAR(64) REFERENCES mission_plans(id) ON DELETE CASCADE,
    zone_id VARCHAR(64) REFERENCES zones(id) ON DELETE SET NULL,
    estimated_waste_collected DOUBLE PRECISION DEFAULT 0.0,
    unit VARCHAR(20) DEFAULT 'kg',
    verification_status VARCHAR(50) DEFAULT 'SIMULATED_VERIFIED',
    evidence_photo_url VARCHAR(255),
    data_source VARCHAR(60) DEFAULT 'simulated_cleanup',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleanups_mission ON cleanup_records(mission_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanup_records ENABLE ROW LEVEL SECURITY;

-- Read policies for public/authenticated demo access
CREATE POLICY "Public read water_bodies" ON water_bodies FOR SELECT USING (true);
CREATE POLICY "Public read zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Public read waste_reports" ON waste_reports FOR SELECT USING (true);
CREATE POLICY "Public read mission_plans" ON mission_plans FOR SELECT USING (true);
CREATE POLICY "Public read telemetry_events" ON telemetry_events FOR SELECT USING (true);
CREATE POLICY "Public read mission_events" ON mission_events FOR SELECT USING (true);
CREATE POLICY "Public read cleanup_records" ON cleanup_records FOR SELECT USING (true);
