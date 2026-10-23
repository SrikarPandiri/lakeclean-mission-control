import math
from typing import List, Dict, Any, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS points in kilometers using Haversine formula."""
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 4)

def extract_zone_center(geometry_geojson: Dict[str, Any]) -> Tuple[float, float]:
    """Extract approximate centroid from polygon coordinates or Point."""
    geom_type = geometry_geojson.get("type", "")
    coords = geometry_geojson.get("coordinates", [])

    if geom_type == "Point":
        # GeoJSON is [lon, lat]
        return float(coords[1]), float(coords[0])
    
    if geom_type == "Polygon" and coords:
        poly_coords = coords[0]
        lats = [pt[1] for pt in poly_coords]
        lngs = [pt[0] for pt in poly_coords]
        return float(sum(lats) / len(lats)), float(sum(lngs) / len(lngs))

    # Fallback default
    return 0.0, 0.0

def plan_deterministic_route(
    launch_lat: float,
    launch_lng: float,
    zones: List[Dict[str, Any]],
    boat_speed_kmh: float = 4.5,
    cleaning_time_per_zone_mins: float = 12.0,
    drain_per_km_pct: float = 12.0,
    drain_per_zone_pct: float = 4.0,
    initial_battery_pct: float = 100.0,
    initial_bin_fill_pct: float = 0.0,
    max_bin_capacity_kg: float = 40.0
) -> Dict[str, Any]:
    """
    Deterministic route planning using Priority-Aware Greedy TSP heuristic:
    Starts at launch point -> visits optimal sequence of zones based on priority & distance trade-off -> returns to launch point.
    """
    if not zones:
        return {
            "ordered_zones": [],
            "ordered_zone_ids": [],
            "total_distance_km": 0.0,
            "travel_time_minutes": 0.0,
            "cleaning_time_minutes": 0.0,
            "total_duration_minutes": 0.0,
            "battery_drain_pct": 0.0,
            "final_battery_pct": initial_battery_pct,
            "estimated_collected_waste_kg": 0.0,
            "final_bin_fill_pct": initial_bin_fill_pct,
            "waypoints": [{"name": "Dock / Launch Point", "lat": launch_lat, "lng": launch_lng, "type": "dock"}],
            "route_geojson": {
                "type": "LineString",
                "coordinates": [[launch_lng, launch_lat]]
            }
        }

    # Prepare zone representations
    zone_items = []
    for z in zones:
        lat, lng = extract_zone_center(z["geometry_geojson"])
        priority = z.get("priority_score", 50.0)
        severity = z.get("severity_score", 50.0)
        density = z.get("waste_density_score", 50.0)
        
        # Estimate waste in kg: baseline 1.5kg + severity*0.08 + density*0.06
        est_waste_kg = round(1.5 + (severity * 0.08) + (density * 0.06), 2)
        
        zone_items.append({
            "id": z["id"],
            "name": z["name"],
            "lat": lat,
            "lng": lng,
            "priority": priority,
            "est_waste_kg": est_waste_kg,
            "is_restricted": z.get("is_restricted", False),
            "raw": z
        })

    # Sequence planning starting from launch point
    current_lat = launch_lat
    current_lng = launch_lng
    unvisited = list(zone_items)
    ordered_zones = []

    while unvisited:
        best_zone = None
        best_score = -1e9
        
        for z in unvisited:
            dist = haversine_distance_km(current_lat, current_lng, z["lat"], z["lng"])
            # Priority-weighted distance utility
            # Higher priority and lower distance yield higher score
            priority_factor = max(1.0, z["priority"]) ** 1.15
            dist_penalty = (dist + 0.08) * 10.0
            score = priority_factor / dist_penalty
            
            if score > best_score:
                best_score = score
                best_zone = z

        ordered_zones.append(best_zone)
        unvisited.remove(best_zone)
        current_lat = best_zone["lat"]
        current_lng = best_zone["lng"]

    # Build sequence of detailed waypoints and calculate total distance
    waypoints = []
    # 1. Start at Launch Point
    waypoints.append({
        "index": 0,
        "name": "Dock / Launch Point",
        "lat": launch_lat,
        "lng": launch_lng,
        "type": "dock",
        "action": "DEPARTURE"
    })

    total_distance_km = 0.0
    prev_lat = launch_lat
    prev_lng = launch_lng

    wp_idx = 1
    for oz in ordered_zones:
        # Distance to approach zone
        d_to_zone = haversine_distance_km(prev_lat, prev_lng, oz["lat"], oz["lng"])
        total_distance_km += d_to_zone
        
        # Zone arrival waypoint
        waypoints.append({
            "index": wp_idx,
            "name": f"Approach: {oz['name']}",
            "lat": oz["lat"],
            "lng": oz["lng"],
            "zone_id": oz["id"],
            "type": "zone_entry",
            "action": "COMMENCE_CLEANING"
        })
        wp_idx += 1

        # Simulate small cleaning pattern around zone centroid (+- 0.0004 deg approx 40m sweep)
        sweep_lat = oz["lat"] + 0.0003
        sweep_lng = oz["lng"] + 0.0003
        d_sweep1 = haversine_distance_km(oz["lat"], oz["lng"], sweep_lat, sweep_lng)
        total_distance_km += d_sweep1

        waypoints.append({
            "index": wp_idx,
            "name": f"Cleaning Sweep: {oz['name']}",
            "lat": sweep_lat,
            "lng": sweep_lng,
            "zone_id": oz["id"],
            "type": "cleaning",
            "action": "SKIM_SURFACE"
        })
        wp_idx += 1

        prev_lat = sweep_lat
        prev_lng = sweep_lng

    # Return to Dock / Launch Point
    d_return = haversine_distance_km(prev_lat, prev_lng, launch_lat, launch_lng)
    total_distance_km += d_return
    waypoints.append({
        "index": wp_idx,
        "name": "Return to Dock / Launch Point",
        "lat": launch_lat,
        "lng": launch_lng,
        "type": "dock",
        "action": "DOCK_AND_DISCHARGE"
    })

    total_distance_km = round(total_distance_km, 3)

    # Durations
    travel_time_minutes = round((total_distance_km / max(0.5, boat_speed_kmh)) * 60.0, 1)
    cleaning_time_minutes = round(len(ordered_zones) * cleaning_time_per_zone_mins, 1)
    total_duration_minutes = round(travel_time_minutes + cleaning_time_minutes, 1)

    # Battery consumption
    bat_travel = round(total_distance_km * drain_per_km_pct, 2)
    bat_cleaning = round(len(ordered_zones) * drain_per_zone_pct, 2)
    total_battery_drain = round(bat_travel + bat_cleaning, 2)
    final_battery = round(max(0.0, initial_battery_pct - total_battery_drain), 2)

    # Waste estimation
    total_waste_kg = round(sum(oz["est_waste_kg"] for oz in ordered_zones), 2)
    bin_fill_increment = round((total_waste_kg / max(1.0, max_bin_capacity_kg)) * 100.0, 2)
    projected_bin_fill = round(initial_bin_fill_pct + bin_fill_increment, 2)
    final_bin_fill = round(min(100.0, projected_bin_fill), 2)

    # Route GeoJSON LineString
    coordinates = [[wp["lng"], wp["lat"]] for wp in waypoints]
    route_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": coordinates
        },
        "properties": {
            "total_distance_km": total_distance_km,
            "total_duration_minutes": total_duration_minutes,
            "waypoint_count": len(waypoints)
        }
    }

    return {
        "ordered_zones": ordered_zones,
        "ordered_zone_ids": [oz["id"] for oz in ordered_zones],
        "total_distance_km": total_distance_km,
        "travel_time_minutes": travel_time_minutes,
        "cleaning_time_minutes": cleaning_time_minutes,
        "total_duration_minutes": total_duration_minutes,
        "battery_required_travel_pct": bat_travel,
        "battery_required_cleaning_pct": bat_cleaning,
        "total_battery_drain_pct": total_battery_drain,
        "final_battery_pct": final_battery,
        "estimated_collected_waste_kg": total_waste_kg,
        "bin_fill_increment_pct": bin_fill_increment,
        "projected_bin_fill_pct": projected_bin_fill,
        "final_bin_fill_pct": final_bin_fill,
        "waypoints": waypoints,
        "route_geojson": route_geojson
    }
