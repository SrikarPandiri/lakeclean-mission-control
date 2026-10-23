from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models.models import (
    WaterBody, Zone, WasteReport, MissionPlan, TelemetryEvent, MissionEvent, CleanupRecord, Profile
)
from backend.app.services.scoring import calculate_priority_score
from backend.app.services.route_planner import plan_deterministic_route

def seed_database(db: Session, force: bool = False):
    """Populates the database with realistic synthetic demonstration data if empty."""
    existing_lakes = db.query(WaterBody).count()
    if existing_lakes > 0 and not force:
        print("[LakeClean Seed] Database already seeded. Skipping.")
        return

    print("[LakeClean Seed] Seeding demonstration lake, zones, reports, and missions...")

    # 1. Profile
    admin_profile = Profile(
        id="operator-demo-01",
        display_name="Mission Commander (Demo)",
        role="operator"
    )
    db.add(admin_profile)

    # 2. Demonstration Water Body: Austin Town Lake / Lady Bird Reservoir Basin
    lake_lat = 30.2580
    lake_lng = -97.7420
    launch_lat = 30.2540
    launch_lng = -97.7495

    lake_boundary = {
        "type": "Polygon",
        "coordinates": [[
            [-97.7550, 30.2520],
            [-97.7520, 30.2570],
            [-97.7440, 30.2620],
            [-97.7340, 30.2610],
            [-97.7300, 30.2550],
            [-97.7370, 30.2510],
            [-97.7470, 30.2500],
            [-97.7550, 30.2520]
        ]]
    }

    water_body = WaterBody(
        id="lake-austin-basin-demo",
        name="Lady Bird Urban Lake (Demo Basin)",
        description="Demonstration urban reservoir with storm drain inflows, recreational park shorelines, and protected cove habitat.",
        boundary_geojson=lake_boundary,
        launch_point_lat=launch_lat,
        launch_point_lng=launch_lng,
        data_source="synthetic_demo"
    )
    db.add(water_body)
    db.flush()

    # 3. Zones with real coordinates around the lake
    zone_defs = [
        {
            "id": "zone-north-inflow",
            "name": "North Inflow Storm Drain",
            "description": "Urban runoff catchment point collecting street litter and single-use plastics after rain events.",
            "coords": [[-97.7460, 30.2605], [-97.7440, 30.2618], [-97.7420, 30.2600], [-97.7445, 30.2590], [-97.7460, 30.2605]],
            "severity": 86.0,
            "density": 82.0,
            "runoff": 88.0,
            "is_restricted": False
        },
        {
            "id": "zone-marina-bay",
            "name": "Kayak Pier & Marina Bay",
            "description": "High public access area with frequent food wrappers, beverage cans, and water bottles.",
            "coords": [[-97.7510, 30.2545], [-97.7490, 30.2558], [-97.7475, 30.2542], [-97.7495, 30.2530], [-97.7510, 30.2545]],
            "severity": 74.0,
            "density": 68.0,
            "runoff": 42.0,
            "is_restricted": False
        },
        {
            "id": "zone-east-shoreline",
            "name": "East Shoreline Reed Beds",
            "description": "Dense wetland reeds trapping floating polystyrene and degraded packaging.",
            "coords": [[-97.7360, 30.2580], [-97.7330, 30.2595], [-97.7315, 30.2565], [-97.7345, 30.2555], [-97.7360, 30.2580]],
            "severity": 62.0,
            "density": 55.0,
            "runoff": 38.0,
            "is_restricted": False
        },
        {
            "id": "zone-south-park",
            "name": "South Boardwalk & Beach",
            "description": "Park shoreline prone to weekend picnic litter and floating packaging.",
            "coords": [[-97.7420, 30.2515], [-97.7390, 30.2528], [-97.7380, 30.2505], [-97.7410, 30.2498], [-97.7420, 30.2515]],
            "severity": 65.0,
            "density": 60.0,
            "runoff": 45.0,
            "is_restricted": False
        },
        {
            "id": "zone-central-channel",
            "name": "Central Navigation Channel",
            "description": "Deep water passage with sparse floating debris but active recreational boat traffic.",
            "coords": [[-97.7440, 30.2560], [-97.7390, 30.2575], [-97.7380, 30.2548], [-97.7430, 30.2535], [-97.7440, 30.2560]],
            "severity": 30.0,
            "density": 25.0,
            "runoff": 20.0,
            "is_restricted": False
        },
        {
            "id": "zone-wildlife-sanctuary",
            "name": "Wildlife Sanctuary Cove (Restricted)",
            "description": "Protected turtle and waterbird nesting bay. No autonomous watercraft entry permitted.",
            "coords": [[-97.7330, 30.2530], [-97.7305, 30.2545], [-97.7295, 30.2515], [-97.7320, 30.2505], [-97.7330, 30.2530]],
            "severity": 88.0,
            "density": 80.0,
            "runoff": 70.0,
            "is_restricted": True
        }
    ]

    zones_created = []
    for zd in zone_defs:
        geom = {
            "type": "Polygon",
            "coordinates": [zd["coords"]]
        }
        score_info = calculate_priority_score(
            severity=zd["severity"],
            waste_density=zd["density"],
            runoff_exposure=zd["runoff"]
        )
        z = Zone(
            id=zd["id"],
            water_body_id=water_body.id,
            name=zd["name"],
            description=zd["description"],
            geometry_geojson=geom,
            severity_score=zd["severity"],
            waste_density_score=zd["density"],
            runoff_exposure_score=zd["runoff"],
            priority_score=score_info["priority_score"],
            is_restricted=zd["is_restricted"],
            data_source="synthetic_demo"
        )
        db.add(z)
        zones_created.append(z)

    db.flush()

    # 4. Waste Reports
    now = datetime.utcnow()
    reports_data = [
        {
            "title": "Accumulation of PET bottles near storm culvert",
            "zone_id": "zone-north-inflow",
            "category": "Plastic bottles",
            "severity": "CRITICAL",
            "density": 85.0,
            "lat": 30.2608,
            "lng": -97.7442,
            "desc": "Cluster of roughly 40-50 clear beverage bottles trapped against outflow grate.",
            "age_hours": 3,
            "verif": "VERIFIED",
            "status": "OPEN"
        },
        {
            "title": "Expanded polystyrene food packaging fragments",
            "zone_id": "zone-marina-bay",
            "category": "Floating packaging",
            "severity": "HIGH",
            "density": 70.0,
            "lat": 30.2550,
            "lng": -97.7492,
            "desc": "White styrofoam takeout trays floating adjacent to rental kayak slips.",
            "age_hours": 14,
            "verif": "VERIFIED",
            "status": "OPEN"
        },
        {
            "title": "Snack wrappers and plastic film caught in rushes",
            "zone_id": "zone-east-shoreline",
            "category": "Plastic wrappers",
            "severity": "MEDIUM",
            "density": 55.0,
            "lat": 30.2575,
            "lng": -97.7340,
            "desc": "Polyethylene snack bags tangled in shoreline vegetation.",
            "age_hours": 30,
            "verif": "VERIFIED",
            "status": "OPEN"
        },
        {
            "title": "Aluminum cans and plastic cups along beach",
            "zone_id": "zone-south-park",
            "category": "Mixed waste",
            "severity": "HIGH",
            "density": 65.0,
            "lat": 30.2512,
            "lng": -97.7405,
            "desc": "Post-weekend beverage refuse drifting 5 meters from public boardwalk.",
            "age_hours": 18,
            "verif": "VERIFIED",
            "status": "OPEN"
        },
        {
            "title": "Fallen branches and organic leaf raft",
            "zone_id": "zone-central-channel",
            "category": "Organic debris",
            "severity": "LOW",
            "density": 25.0,
            "lat": 30.2555,
            "lng": -97.7410,
            "desc": "Natural driftwood cluster with minimal entangled plastic.",
            "age_hours": 48,
            "verif": "VERIFIED",
            "status": "RESOLVED"
        },
        {
            "title": "Entangled agricultural film near sanctuary boundary",
            "zone_id": "zone-wildlife-sanctuary",
            "category": "Other visible floating waste",
            "severity": "CRITICAL",
            "density": 80.0,
            "lat": 30.2525,
            "lng": -97.7315,
            "desc": "Large tarp sheet trapped near reed border. Zone is restricted for boat safety.",
            "age_hours": 6,
            "verif": "VERIFIED",
            "status": "OPEN"
        },
        {
            "title": "Reported discarded beverage crates",
            "zone_id": "zone-north-inflow",
            "category": "Mixed waste",
            "severity": "MEDIUM",
            "density": 45.0,
            "lat": 30.2598,
            "lng": -97.7450,
            "desc": "Plastic milk crate bobbing near bank.",
            "age_hours": 72,
            "verif": "UNVERIFIED",
            "status": "OPEN"
        }
    ]

    for r in reports_data:
        obs_time = now - timedelta(hours=r["age_hours"])
        rep = WasteReport(
            water_body_id=water_body.id,
            zone_id=r["zone_id"],
            title=r["title"],
            category=r["category"],
            severity=r["severity"],
            estimated_density=r["density"],
            latitude=r["lat"],
            longitude=r["lng"],
            description=r["desc"],
            observed_at=obs_time,
            verification_status=r["verif"],
            report_status=r["status"],
            data_source="synthetic_demo",
            created_by="Autonomous Drone Scout (Simulated)"
        )
        db.add(rep)

    db.flush()

    # 5. One completed historical mission to demonstrate telemetry and cleanup records
    historical_zones = [z for z in zones_created if z.id in ["zone-marina-bay", "zone-south-park"]]
    hist_route = plan_deterministic_route(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        zones=[{"id": z.id, "name": z.name, "geometry_geojson": z.geometry_geojson, "priority_score": z.priority_score, "severity_score": z.severity_score, "waste_density_score": z.waste_density_score} for z in historical_zones],
        initial_battery_pct=100.0,
        initial_bin_fill_pct=0.0
    )

    hist_mission = MissionPlan(
        id="mission-hist-001",
        water_body_id=water_body.id,
        name="Mission Dawn Sweep: Marina & South Beach",
        status="COMPLETED",
        selected_zone_ids=["zone-marina-bay", "zone-south-park"],
        planned_route_geojson=hist_route["route_geojson"],
        planned_distance_km=hist_route["total_distance_km"],
        estimated_duration_minutes=hist_route["total_duration_minutes"],
        initial_battery_pct=100.0,
        initial_bin_fill_pct=0.0,
        estimated_final_battery_pct=hist_route["final_battery_pct"],
        estimated_final_bin_fill_pct=hist_route["final_bin_fill_pct"],
        feasibility_status="FEASIBLE",
        planning_summary=hist_route,
        data_source="simulated_model",
        created_by="Lead Operator (Demo)",
        current_waypoint_index=len(hist_route["waypoints"]) - 1,
        current_lat=launch_lat,
        current_lng=launch_lng,
        current_battery_pct=hist_route["final_battery_pct"],
        current_bin_fill_pct=hist_route["final_bin_fill_pct"],
        completed_zone_ids=["zone-marina-bay", "zone-south-park"],
        started_at=now - timedelta(hours=5),
        completed_at=now - timedelta(hours=4, minutes=15)
    )
    db.add(hist_mission)
    db.flush()

    # Add historical events and cleanups
    ev1 = MissionEvent(
        mission_id=hist_mission.id,
        event_type="MISSION_STARTED",
        message="Autonomous cleaning mission initiated from dock.",
        created_at=now - timedelta(hours=5)
    )
    ev2 = MissionEvent(
        mission_id=hist_mission.id,
        event_type="ZONE_CLEANED",
        message="Surface skimming complete in Kayak Pier & Marina Bay. 7.2 kg plastic retrieved.",
        created_at=now - timedelta(hours=4, minutes=45)
    )
    ev3 = MissionEvent(
        mission_id=hist_mission.id,
        event_type="ZONE_CLEANED",
        message="Surface skimming complete in South Boardwalk & Beach. 6.8 kg refuse retrieved.",
        created_at=now - timedelta(hours=4, minutes=25)
    )
    ev4 = MissionEvent(
        mission_id=hist_mission.id,
        event_type="MISSION_COMPLETED",
        message="Mission completed successfully. Docked at launch slip.",
        created_at=now - timedelta(hours=4, minutes=15)
    )
    db.add_all([ev1, ev2, ev3, ev4])

    cl1 = CleanupRecord(
        mission_id=hist_mission.id,
        zone_id="zone-marina-bay",
        estimated_waste_collected=7.2,
        unit="kg",
        verification_status="SIMULATED_VERIFIED",
        completed_at=now - timedelta(hours=4, minutes=45)
    )
    cl2 = CleanupRecord(
        mission_id=hist_mission.id,
        zone_id="zone-south-park",
        estimated_waste_collected=6.8,
        unit="kg",
        verification_status="SIMULATED_VERIFIED",
        completed_at=now - timedelta(hours=4, minutes=25)
    )
    db.add_all([cl1, cl2])

    # 6. One active planned mission ready for operator to inspect or simulate!
    planned_zones = [z for z in zones_created if z.id in ["zone-north-inflow", "zone-east-shoreline"]]
    p_route = plan_deterministic_route(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        zones=[{"id": z.id, "name": z.name, "geometry_geojson": z.geometry_geojson, "priority_score": z.priority_score, "severity_score": z.severity_score, "waste_density_score": z.waste_density_score} for z in planned_zones],
        initial_battery_pct=100.0,
        initial_bin_fill_pct=0.0
    )

    planned_mission = MissionPlan(
        id="mission-north-inflow-002",
        water_body_id=water_body.id,
        name="High Priority: North Storm Culvert & East Reeds",
        status="PLANNED",
        selected_zone_ids=["zone-north-inflow", "zone-east-shoreline"],
        planned_route_geojson=p_route["route_geojson"],
        planned_distance_km=p_route["total_distance_km"],
        estimated_duration_minutes=p_route["total_duration_minutes"],
        initial_battery_pct=100.0,
        initial_bin_fill_pct=0.0,
        estimated_final_battery_pct=p_route["final_battery_pct"],
        estimated_final_bin_fill_pct=p_route["final_bin_fill_pct"],
        feasibility_status="FEASIBLE",
        planning_summary=p_route,
        data_source="simulated_model",
        created_by="Lead Operator",
        current_waypoint_index=0,
        current_lat=launch_lat,
        current_lng=launch_lng,
        current_battery_pct=100.0,
        current_bin_fill_pct=0.0,
        completed_zone_ids=[]
    )
    db.add(planned_mission)

    db.commit()
    print("[LakeClean Seed] Demonstration database seeded successfully!")
