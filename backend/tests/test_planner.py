from backend.app.services.route_planner import (
    haversine_distance_km, extract_zone_center, plan_deterministic_route
)

def test_haversine_distance():
    # Distance between Austin launch (30.2540, -97.7495) and North Inflow (30.2608, -97.7442) ~ 0.9 - 1.2 km
    dist = haversine_distance_km(30.2540, -97.7495, 30.2608, -97.7442)
    assert 0.7 < dist < 1.5

def test_extract_zone_center_polygon():
    polygon_geo = {
        "type": "Polygon",
        "coordinates": [[[10.0, 20.0], [12.0, 20.0], [12.0, 22.0], [10.0, 22.0], [10.0, 20.0]]]
    }
    lat, lng = extract_zone_center(polygon_geo)
    # Average lat is (20+20+22+22+20)/5 = 20.8, lng is 10.8
    assert abs(lat - 20.8) < 0.01
    assert abs(lng - 10.8) < 0.01

def test_deterministic_route_generation():
    launch_lat = 30.2540
    launch_lng = -97.7495
    zones = [
        {
            "id": "z1",
            "name": "Zone 1",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7450, 30.2580]},
            "priority_score": 80.0,
            "severity_score": 75.0,
            "waste_density_score": 70.0
        },
        {
            "id": "z2",
            "name": "Zone 2",
            "geometry_geojson": {"type": "Point", "coordinates": [-97.7400, 30.2520]},
            "priority_score": 50.0,
            "severity_score": 45.0,
            "waste_density_score": 40.0
        }
    ]

    result = plan_deterministic_route(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        zones=zones
    )

    assert result["total_distance_km"] > 0
    assert result["total_duration_minutes"] > 0
    assert len(result["waypoints"]) >= 4  # Start, Zone1 entry, Zone1 sweep, Zone2 entry, Zone2 sweep, Return dock
    assert result["waypoints"][0]["name"] == "Dock / Launch Point"
    assert result["waypoints"][-1]["name"] == "Return to Dock / Launch Point"
    assert result["estimated_collected_waste_kg"] > 0
    assert result["route_geojson"]["type"] == "Feature"
