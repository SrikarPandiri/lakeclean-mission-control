from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.api.deps import get_db
from backend.app.models.models import MissionPlan, WaterBody, Zone, MissionEvent, TelemetryEvent
from backend.app.schemas.schemas import (
    MissionPlanRequest, FeasibilityReport, MissionCreate, MissionResponse,
    SimulationTickResponse, MissionEventResponse, TelemetryEventResponse
)
from backend.app.services.feasibility import check_mission_feasibility
from backend.app.services.simulator import MissionSimulationService

router = APIRouter(prefix="/missions", tags=["Missions"])

@router.post("/plan", response_model=FeasibilityReport)
def generate_candidate_plan(payload: MissionPlanRequest, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == payload.water_body_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Referenced water body not found")

    # Fetch zones
    selected_zones_db = db.query(Zone).filter(Zone.id.in_(payload.selected_zone_ids)).all()
    selected_zones_data = [
        {
            "id": z.id,
            "name": z.name,
            "geometry_geojson": z.geometry_geojson,
            "priority_score": z.priority_score,
            "severity_score": z.severity_score,
            "waste_density_score": z.waste_density_score,
            "is_restricted": z.is_restricted
        } for z in selected_zones_db
    ]

    feasibility_res = check_mission_feasibility(
        launch_lat=lake.launch_point_lat,
        launch_lng=lake.launch_point_lng,
        selected_zones=selected_zones_data,
        initial_battery_pct=payload.initial_battery_pct,
        initial_bin_fill_pct=payload.initial_bin_fill_pct,
        battery_reserve_pct=payload.battery_reserve_pct,
        max_bin_capacity_kg=payload.max_bin_capacity_kg,
        boat_speed_kmh=payload.boat_speed_kmh,
        cleaning_time_per_zone_mins=payload.cleaning_time_per_zone_mins,
        drain_per_km_pct=payload.drain_per_km_pct,
        drain_per_zone_pct=payload.drain_per_zone_pct
    )

    return feasibility_res

@router.post("", response_model=MissionResponse)
def create_mission(payload: MissionCreate, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == payload.water_body_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Referenced water body not found")

    coords = payload.planned_route_geojson.get("geometry", {}).get("coordinates", []) if payload.planned_route_geojson else []
    start_lat = coords[0][1] if coords else lake.launch_point_lat
    start_lng = coords[0][0] if coords else lake.launch_point_lng

    mission = MissionPlan(
        water_body_id=payload.water_body_id,
        name=payload.name,
        status="PLANNED",
        selected_zone_ids=payload.selected_zone_ids,
        planned_route_geojson=payload.planned_route_geojson,
        planned_distance_km=payload.planned_distance_km,
        estimated_duration_minutes=payload.estimated_duration_minutes,
        initial_battery_pct=payload.initial_battery_pct,
        initial_bin_fill_pct=payload.initial_bin_fill_pct,
        estimated_final_battery_pct=payload.estimated_final_battery_pct,
        estimated_final_bin_fill_pct=payload.estimated_final_bin_fill_pct,
        feasibility_status=payload.feasibility_status,
        planning_summary=payload.planning_summary,
        current_waypoint_index=0,
        current_lat=start_lat,
        current_lng=start_lng,
        current_battery_pct=payload.initial_battery_pct,
        current_bin_fill_pct=payload.initial_bin_fill_pct,
        completed_zone_ids=[]
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    # Initial event
    event = MissionEvent(
        mission_id=mission.id,
        event_type="MISSION_CREATED",
        message=f"Mission plan '{mission.name}' saved and ready for execution.",
        metadata_json={"feasibility": mission.feasibility_status}
    )
    db.add(event)
    db.commit()

    return mission

@router.get("", response_model=List[MissionResponse])
def get_missions(
    water_body_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MissionPlan)
    if water_body_id:
        query = query.filter(MissionPlan.water_body_id == water_body_id)
    if status:
        query = query.filter(MissionPlan.status == status)
    return query.order_by(MissionPlan.created_at.desc()).all()

@router.get("/{mission_id}", response_model=MissionResponse)
def get_mission(mission_id: str, db: Session = Depends(get_db)):
    mission = db.query(MissionPlan).filter(MissionPlan.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission

@router.post("/{mission_id}/start", response_model=MissionResponse)
def start_mission_simulation(mission_id: str, db: Session = Depends(get_db)):
    try:
        return MissionSimulationService.start_mission(db, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{mission_id}/pause", response_model=MissionResponse)
def pause_mission_simulation(mission_id: str, db: Session = Depends(get_db)):
    try:
        return MissionSimulationService.pause_mission(db, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{mission_id}/resume", response_model=MissionResponse)
def resume_mission_simulation(mission_id: str, db: Session = Depends(get_db)):
    try:
        return MissionSimulationService.resume_mission(db, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{mission_id}/abort", response_model=MissionResponse)
def abort_mission_simulation(mission_id: str, db: Session = Depends(get_db)):
    try:
        return MissionSimulationService.abort_mission(db, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{mission_id}/tick", response_model=SimulationTickResponse)
def tick_mission_simulation(mission_id: str, db: Session = Depends(get_db)):
    try:
        return MissionSimulationService.tick_mission(db, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{mission_id}/events", response_model=List[MissionEventResponse])
def get_mission_events(mission_id: str, db: Session = Depends(get_db)):
    return db.query(MissionEvent).filter(MissionEvent.mission_id == mission_id).order_by(MissionEvent.created_at.asc()).all()

@router.get("/{mission_id}/telemetry", response_model=List[TelemetryEventResponse])
def get_mission_telemetry(mission_id: str, db: Session = Depends(get_db)):
    return db.query(TelemetryEvent).filter(TelemetryEvent.mission_id == mission_id).order_by(TelemetryEvent.recorded_at.desc()).limit(50).all()
