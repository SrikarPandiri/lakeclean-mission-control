from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import (
    MissionPlan, TelemetryEvent, MissionEvent, CleanupRecord, Zone
)

class MissionSimulationService:
    @staticmethod
    def start_mission(db: Session, mission_id: str) -> MissionPlan:
        mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} not found.")

        if mission.status not in ["PLANNED", "FEASIBLE", "DRAFT"]:
            raise ValueError(f"Cannot start mission from current state: {mission.status}")

        mission.status = "RUNNING"
        mission.started_at = datetime.utcnow()
        mission.current_waypoint_index = 0

        # Initialize position at launch point / waypoint 0
        waypoints = mission.planned_route_geojson.get("geometry", {}).get("coordinates", []) if mission.planned_route_geojson else []
        if waypoints:
            mission.current_lng = waypoints[0][0]
            mission.current_lat = waypoints[0][1]

        mission.current_battery_pct = mission.initial_battery_pct
        mission.current_bin_fill_pct = mission.initial_bin_fill_pct
        mission.completed_zone_ids = []

        # Record start event
        event = MissionEvent(
            mission_id=mission.id,
            event_type="MISSION_STARTED",
            message=f"Autonomous cleaning mission '{mission.name}' initiated from dock.",
            metadata_json={"started_at": mission.started_at.isoformat()}
        )
        db.add(event)

        # Record initial telemetry
        telemetry = TelemetryEvent(
            mission_id=mission.id,
            latitude=mission.current_lat or 0.0,
            longitude=mission.current_lng or 0.0,
            battery_pct=mission.current_battery_pct,
            bin_fill_pct=mission.current_bin_fill_pct,
            mission_status="RUNNING",
            event_type="MISSION_STARTED",
            event_message="Mission launched at dock."
        )
        db.add(telemetry)

        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def pause_mission(db: Session, mission_id: str) -> MissionPlan:
        mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} not found.")

        if mission.status != "RUNNING":
            raise ValueError(f"Cannot pause mission with status '{mission.status}'. Mission must be RUNNING.")

        mission.status = "PAUSED"
        event = MissionEvent(
            mission_id=mission.id,
            event_type="MISSION_PAUSED",
            message="Operator paused autonomous boat execution.",
            metadata_json={"waypoint": mission.current_waypoint_index}
        )
        db.add(event)
        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def resume_mission(db: Session, mission_id: str) -> MissionPlan:
        mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} not found.")

        if mission.status != "PAUSED":
            raise ValueError(f"Cannot resume mission with status '{mission.status}'. Mission must be PAUSED.")

        mission.status = "RUNNING"
        event = MissionEvent(
            mission_id=mission.id,
            event_type="MISSION_RESUMED",
            message="Autonomous cleaning mission resumed by operator.",
            metadata_json={"waypoint": mission.current_waypoint_index}
        )
        db.add(event)
        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def abort_mission(db: Session, mission_id: str, reason: str = "Operator aborted mission") -> MissionPlan:
        mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} not found.")

        if mission.status in ["COMPLETED", "ABORTED"]:
            raise ValueError(f"Mission is already finalized with status '{mission.status}'.")

        mission.status = "ABORTED"
        mission.completed_at = datetime.utcnow()

        event = MissionEvent(
            mission_id=mission.id,
            event_type="MISSION_ABORTED",
            message=f"Mission safely aborted: {reason}",
            metadata_json={"aborted_at": mission.completed_at.isoformat(), "reason": reason}
        )
        db.add(event)
        db.commit()
        db.refresh(mission)
        return mission

    @staticmethod
    def tick_mission(db: Session, mission_id: str) -> Dict[str, Any]:
        mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
        if not mission:
            raise ValueError(f"Mission {mission_id} not found.")

        if mission.status != "RUNNING":
            return {
                "mission_id": mission.id,
                "status": mission.status,
                "current_waypoint_index": mission.current_waypoint_index,
                "total_waypoints": 0,
                "current_lat": mission.current_lat or 0.0,
                "current_lng": mission.current_lng or 0.0,
                "current_battery_pct": mission.current_battery_pct,
                "current_bin_fill_pct": mission.current_bin_fill_pct,
                "completed_zone_ids": mission.completed_zone_ids or [],
                "events_triggered": [],
                "is_finished": mission.status in ["COMPLETED", "ABORTED"],
                "status_message": f"Simulation idle (status is {mission.status})"
            }

        summary = mission.planning_summary or {}
        waypoints_detail = summary.get("waypoints", [])
        total_wps = len(waypoints_detail)

        if total_wps == 0:
            mission.status = "COMPLETED"
            mission.completed_at = datetime.utcnow()
            db.commit()
            return {
                "mission_id": mission.id,
                "status": mission.status,
                "current_waypoint_index": 0,
                "total_waypoints": 0,
                "current_lat": mission.current_lat or 0.0,
                "current_lng": mission.current_lng or 0.0,
                "current_battery_pct": mission.current_battery_pct,
                "current_bin_fill_pct": mission.current_bin_fill_pct,
                "completed_zone_ids": [],
                "events_triggered": ["MISSION_COMPLETED"],
                "is_finished": True,
                "status_message": "No waypoints configured. Mission completed."
            }

        next_idx = mission.current_waypoint_index + 1
        events_triggered = []

        if next_idx >= total_wps:
            # Reached destination dock and finalized
            mission.status = "COMPLETED"
            mission.completed_at = datetime.utcnow()
            mission.current_battery_pct = max(0.0, mission.estimated_final_battery_pct)
            mission.current_bin_fill_pct = min(100.0, mission.estimated_final_bin_fill_pct)

            completed_event = MissionEvent(
                mission_id=mission.id,
                event_type="MISSION_COMPLETED",
                message=f"Mission '{mission.name}' successfully completed. Boat docked.",
                metadata_json={"completed_at": mission.completed_at.isoformat()}
            )
            db.add(completed_event)
            events_triggered.append("MISSION_COMPLETED")

            db.commit()
            db.refresh(mission)

            return {
                "mission_id": mission.id,
                "status": "COMPLETED",
                "current_waypoint_index": total_wps - 1,
                "total_waypoints": total_wps,
                "current_lat": mission.current_lat,
                "current_lng": mission.current_lng,
                "current_battery_pct": mission.current_battery_pct,
                "current_bin_fill_pct": mission.current_bin_fill_pct,
                "completed_zone_ids": mission.completed_zone_ids or [],
                "events_triggered": events_triggered,
                "is_finished": True,
                "status_message": "Mission finished successfully. Docked."
            }

        # Step to next waypoint
        mission.current_waypoint_index = next_idx
        target_wp = waypoints_detail[next_idx]
        mission.current_lat = target_wp["lat"]
        mission.current_lng = target_wp["lng"]

        # Calculate progress ratio
        ratio = next_idx / max(1, total_wps - 1)
        total_bat_drain = mission.initial_battery_pct - mission.estimated_final_battery_pct
        mission.current_battery_pct = round(max(0.0, mission.initial_battery_pct - (ratio * total_bat_drain)), 1)

        total_bin_inc = mission.estimated_final_bin_fill_pct - mission.initial_bin_fill_pct
        mission.current_bin_fill_pct = round(min(100.0, mission.initial_bin_fill_pct + (ratio * total_bin_inc)), 1)

        # Handle zone entry or cleaning events
        wp_action = target_wp.get("action", "")
        zone_id = target_wp.get("zone_id")
        completed_zones = list(mission.completed_zone_ids or [])

        if wp_action == "COMMENCE_CLEANING":
            ev = MissionEvent(
                mission_id=mission.id,
                event_type="ZONE_ENTERED",
                message=f"Entered cleaning sector for {target_wp.get('name', 'zone')}.",
                metadata_json={"zone_id": zone_id, "lat": target_wp["lat"], "lng": target_wp["lng"]}
            )
            db.add(ev)
            events_triggered.append("ZONE_ENTERED")

        elif wp_action == "SKIM_SURFACE" and zone_id:
            if zone_id not in completed_zones:
                completed_zones.append(zone_id)
                mission.completed_zone_ids = completed_zones
                
                # Fetch zone details for waste estimate
                zone = db.query(Zone).filter(Zone.id == zone_id).first()
                waste_kg = round(2.5 + ((zone.severity_score if zone else 50.0) * 0.08), 2)
                
                cleanup = CleanupRecord(
                    mission_id=mission.id,
                    zone_id=zone_id,
                    estimated_waste_collected=waste_kg,
                    unit="kg",
                    verification_status="SIMULATED_VERIFIED"
                )
                db.add(cleanup)

                ev = MissionEvent(
                    mission_id=mission.id,
                    event_type="ZONE_CLEANED",
                    message=f"Completed surface cleaning in {zone.name if zone else 'zone'}. Estimated collected: {waste_kg} kg.",
                    metadata_json={"zone_id": zone_id, "collected_kg": waste_kg}
                )
                db.add(ev)
                events_triggered.append("ZONE_CLEANED")

        # Telemetry event
        telem = TelemetryEvent(
            mission_id=mission.id,
            latitude=mission.current_lat,
            longitude=mission.current_lng,
            battery_pct=mission.current_battery_pct,
            bin_fill_pct=mission.current_bin_fill_pct,
            mission_status="RUNNING",
            event_type="PROGRESS_TICK",
            event_message=f"Reached Waypoint {next_idx}/{total_wps}: {target_wp.get('name', 'Sweep')}"
        )
        db.add(telem)

        # Check safety battery warning
        if mission.current_battery_pct <= 20.0 and "BATTERY_WARNING" not in events_triggered:
            warn = MissionEvent(
                mission_id=mission.id,
                event_type="BATTERY_WARNING",
                message=f"Warning: Low battery reserve alert at {mission.current_battery_pct}%.",
                metadata_json={"battery_pct": mission.current_battery_pct}
            )
            db.add(warn)
            events_triggered.append("BATTERY_WARNING")

        db.commit()
        db.refresh(mission)

        return {
            "mission_id": mission.id,
            "status": mission.status,
            "current_waypoint_index": mission.current_waypoint_index,
            "total_waypoints": total_wps,
            "current_lat": mission.current_lat,
            "current_lng": mission.current_lng,
            "current_battery_pct": mission.current_battery_pct,
            "current_bin_fill_pct": mission.current_bin_fill_pct,
            "completed_zone_ids": mission.completed_zone_ids or [],
            "events_triggered": events_triggered,
            "is_finished": False,
            "status_message": f"Arrived at waypoint {next_idx}/{total_wps}: {target_wp.get('name')}"
        }
