from backend.app.services.feasibility import check_mission_feasibility

def test_feasible_mission():
    launch_lat = 30.2540
    launch_lng = -97.7495
    zones = [
        {
            "id": "z1",
            "name": "Zone Clean 1",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7480, 30.2550]},
            "priority_score": 60.0,
            "severity_score": 50.0,
            "waste_density_score": 50.0,
            "is_restricted": False
        }
    ]

    res = check_mission_feasibility(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        selected_zones=zones,
        initial_battery_pct=100.0,
        battery_reserve_pct=20.0
    )
    assert res["is_feasible"] is True
    assert res["status"] == "FEASIBLE"
    assert len(res["violations"]) == 0

def test_restricted_zone_violation():
    launch_lat = 30.2540
    launch_lng = -97.7495
    zones = [
        {
            "id": "z-sanctuary",
            "name": "Wildlife Sanctuary",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7480, 30.2550]},
            "priority_score": 90.0,
            "severity_score": 90.0,
            "waste_density_score": 90.0,
            "is_restricted": True  # Restricted!
        }
    ]

    res = check_mission_feasibility(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        selected_zones=zones
    )
    assert res["is_feasible"] is False
    assert res["status"] == "INFEASIBLE"
    assert any(v["constraint_name"] == "RESTRICTED_NAVIGATION_ZONE" for v in res["violations"])

def test_battery_reserve_violation():
    launch_lat = 30.2540
    launch_lng = -97.7495
    zones = [
        {
            "id": "z1",
            "name": "Far Zone",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7200, 30.2700]},
            "priority_score": 50.0,
            "severity_score": 50.0,
            "waste_density_score": 50.0,
            "is_restricted": False
        }
    ]

    # Only 10% initial battery, 20% reserve
    res = check_mission_feasibility(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        selected_zones=zones,
        initial_battery_pct=10.0,
        battery_reserve_pct=20.0
    )
    assert res["is_feasible"] is False
    assert any(v["constraint_name"] == "BATTERY_RESERVE_VIOLATION" for v in res["violations"])

def test_bin_capacity_overflow():
    launch_lat = 30.2540
    launch_lng = -97.7495
    zones = [
        {
            "id": "z1",
            "name": "Heavy Zone",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7480, 30.2550]},
            "priority_score": 80.0,
            "severity_score": 80.0,
            "waste_density_score": 80.0,
            "is_restricted": False
        }
    ]

    # Already at 95% bin fill with a small 5kg max bin
    res = check_mission_feasibility(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        selected_zones=zones,
        initial_bin_fill_pct=95.0,
        max_bin_capacity_kg=5.0
    )
    assert res["is_feasible"] is False
    assert any(v["constraint_name"] == "BIN_CAPACITY_OVERFLOW" for v in res["violations"])

def test_zero_zones_violation():
    res = check_mission_feasibility(
        launch_lat=30.2540,
        launch_lng=-97.7495,
        selected_zones=[]
    )
    assert res["is_feasible"] is False
    assert any(v["constraint_name"] == "MINIMUM_ZONE_REQUIREMENT" for v in res["violations"])
