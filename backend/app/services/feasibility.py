from typing import List, Dict, Any
from backend.app.services.route_planner import plan_deterministic_route

def check_mission_feasibility(
    launch_lat: float,
    launch_lng: float,
    selected_zones: List[Dict[str, Any]],
    initial_battery_pct: float = 100.0,
    initial_bin_fill_pct: float = 0.0,
    battery_reserve_pct: float = 20.0,
    max_bin_capacity_kg: float = 40.0,
    boat_speed_kmh: float = 4.5,
    cleaning_time_per_zone_mins: float = 12.0,
    drain_per_km_pct: float = 12.0,
    drain_per_zone_pct: float = 4.0
) -> Dict[str, Any]:
    """
    Evaluates mission feasibility against physical & operational safety constraints.
    Returns feasibility status, detailed violations, suggested actions, and deterministic route.
    """
    violations = []
    notes = []

    # Check 1: Zero zones selected
    if not selected_zones:
        violations.append({
            "constraint_name": "MINIMUM_ZONE_REQUIREMENT",
            "message": "No cleaning zones selected for this mission.",
            "suggested_action": "Select at least one high or medium priority zone to plan a valid cleaning route."
        })
        route_plan = plan_deterministic_route(
            launch_lat=launch_lat,
            launch_lng=launch_lng,
            zones=[],
            initial_battery_pct=initial_battery_pct,
            initial_bin_fill_pct=initial_bin_fill_pct
        )
        return {
            "is_feasible": False,
            "status": "INFEASIBLE",
            "violations": violations,
            "notes": notes,
            **route_plan
        }

    # Check 2: Restricted zones
    restricted_zones = [z for z in selected_zones if z.get("is_restricted", False)]
    if restricted_zones:
        names = ", ".join([z["name"] for z in restricted_zones])
        violations.append({
            "constraint_name": "RESTRICTED_NAVIGATION_ZONE",
            "message": f"Selection contains restricted / no-entry zone(s): {names}.",
            "suggested_action": "Remove restricted zones from mission plan. Boat navigation in protected or hazardous sectors is prohibited."
        })

    # Plan candidate route
    route_plan = plan_deterministic_route(
        launch_lat=launch_lat,
        launch_lng=launch_lng,
        zones=selected_zones,
        boat_speed_kmh=boat_speed_kmh,
        cleaning_time_per_zone_mins=cleaning_time_per_zone_mins,
        drain_per_km_pct=drain_per_km_pct,
        drain_per_zone_pct=drain_per_zone_pct,
        initial_battery_pct=initial_battery_pct,
        initial_bin_fill_pct=initial_bin_fill_pct,
        max_bin_capacity_kg=max_bin_capacity_kg
    )

    final_battery = route_plan["final_battery_pct"]
    final_bin = route_plan.get("projected_bin_fill_pct", route_plan["final_bin_fill_pct"])
    total_drain = route_plan["total_battery_drain_pct"]

    # Check 3: Battery reserve constraint
    if final_battery < battery_reserve_pct:
        deficit = round(battery_reserve_pct - final_battery, 1)
        violations.append({
            "constraint_name": "BATTERY_RESERVE_VIOLATION",
            "message": f"Projected final battery ({final_battery}%) violates safety reserve requirement ({battery_reserve_pct}%). Deficit: {deficit}%.",
            "suggested_action": f"Reduce selected zones from {len(selected_zones)} to fewer zones, recharge boat to 100%, or lower reserve threshold if safe."
        })

    # Check 4: Waste bin capacity constraint
    if final_bin > 100.0:
        overflow = round(final_bin - 100.0, 1)
        violations.append({
            "constraint_name": "BIN_CAPACITY_OVERFLOW",
            "message": f"Projected waste collection exceeds bin capacity ({final_bin}% total fill). Overflow: {overflow}%.",
            "suggested_action": "Empty the collection bin before launching, or reduce cleaning zones in this mission."
        })

    is_feasible = len(violations) == 0
    status = "FEASIBLE" if is_feasible else "INFEASIBLE"

    if is_feasible:
        notes.append(f"Mission verified feasible with {round(final_battery - battery_reserve_pct, 1)}% battery margin above safety reserve.")
        notes.append(f"Estimated mission duration: {route_plan['total_duration_minutes']} min across {route_plan['total_distance_km']} km.")

    return {
        "is_feasible": is_feasible,
        "status": status,
        "violations": violations,
        "notes": notes,
        **route_plan
    }
