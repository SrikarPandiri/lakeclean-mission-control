def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "Demo Mode" in data["mode"]

def test_dashboard_summary(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_waste_hotspots" in data
    assert "high_priority_zones" in data
    assert "missions_completed" in data
    assert data["total_waste_hotspots"] > 0

def test_dashboard_activity(client):
    res = client.get("/api/dashboard/activity")
    assert res.status_code == 200
    data = res.json()
    assert "recent_missions" in data
    assert "recent_reports" in data
    assert "priority_zones" in data

def test_get_lakes_and_zones(client):
    res = client.get("/api/lakes")
    assert res.status_code == 200
    lakes = res.json()
    assert len(lakes) > 0
    lake_id = lakes[0]["id"]

    zones_res = client.get(f"/api/lakes/{lake_id}/zones")
    assert zones_res.status_code == 200
    zones = zones_res.json()
    assert len(zones) >= 4

def test_reports_crud(client):
    # Get lake id
    lakes = client.get("/api/lakes").json()
    lake_id = lakes[0]["id"]

    # 1. Create report
    create_payload = {
        "water_body_id": lake_id,
        "title": "New Floating Plastic Clump",
        "category": "Plastic bottles",
        "severity": "HIGH",
        "estimated_density": 65.0,
        "latitude": 30.255,
        "longitude": -97.745,
        "description": "Observed along south shoreline"
    }
    create_res = client.post("/api/reports", json=create_payload)
    assert create_res.status_code == 200
    report_id = create_res.json()["id"]

    # 2. Get report
    get_res = client.get(f"/api/reports/{report_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "New Floating Plastic Clump"

    # 3. Update report verification
    verify_res = client.patch(f"/api/reports/{report_id}/verification", json={"verification_status": "VERIFIED"})
    assert verify_res.status_code == 200
    assert verify_res.json()["verification_status"] == "VERIFIED"

def test_plan_mission_api(client):
    lakes = client.get("/api/lakes").json()
    lake_id = lakes[0]["id"]
    zones = client.get(f"/api/lakes/{lake_id}/zones").json()
    unrestricted_zone_ids = [z["id"] for z in zones if not z["is_restricted"]][:2]

    payload = {
        "water_body_id": lake_id,
        "mission_name": "Test Feasible Mission",
        "selected_zone_ids": unrestricted_zone_ids,
        "initial_battery_pct": 100.0,
        "initial_bin_fill_pct": 0.0,
        "battery_reserve_pct": 20.0
    }
    plan_res = client.post("/api/missions/plan", json=payload)
    assert plan_res.status_code == 200
    data = plan_res.json()
    assert data["is_feasible"] is True
    assert data["total_distance_km"] > 0
    assert len(data["waypoints"]) > 0

def test_analytics_api(client):
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "missions_by_status" in data
    assert "waste_by_category" in data
    assert "priority_distribution" in data

def test_invalid_report_route(client):
    # Non-existent ID returns 404
    res = client.get("/api/reports/non-existent-id-12345")
    assert res.status_code == 404
