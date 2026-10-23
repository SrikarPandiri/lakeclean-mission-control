from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.api.deps import get_db
from backend.app.models.models import (
    WasteReport, Zone, MissionPlan, CleanupRecord, WaterBody, MissionEvent
)
from backend.app.schemas.schemas import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_hotspots = db.query(WasteReport).filter(WasteReport.report_status != "RESOLVED").count()
    high_priority_zones = db.query(Zone).filter(Zone.priority_score >= 55.0).count()
    completed_missions = db.query(MissionPlan).filter(MissionPlan.status == "COMPLETED").count()
    running_missions = db.query(MissionPlan).filter(MissionPlan.status.in_(["RUNNING", "PAUSED"])).count()
    total_missions = db.query(MissionPlan).count()
    
    total_waste_collected = db.query(func.sum(CleanupRecord.estimated_waste_collected)).scalar() or 0.0
    completion_rate = round((completed_missions / total_missions * 100.0), 1) if total_missions > 0 else 0.0

    # Get latest active or planned mission for battery & bin indicators
    active_mission = db.query(MissionPlan).filter(MissionPlan.status.in_(["RUNNING", "PAUSED", "PLANNED"])).order_by(MissionPlan.updated_at.desc()).first()
    if active_mission:
        bat = active_mission.current_battery_pct
        bin_fill = active_mission.current_bin_fill_pct
    else:
        bat = 100.0
        bin_fill = 0.0

    lake = db.query(WaterBody).first()
    lake_dict = None
    if lake:
        lake_dict = {
            "id": lake.id,
            "name": lake.name,
            "launch_point_lat": lake.launch_point_lat,
            "launch_point_lng": lake.launch_point_lng
        }

    return DashboardSummary(
        total_waste_hotspots=total_hotspots,
        high_priority_zones=high_priority_zones,
        missions_completed=completed_missions,
        missions_running=running_missions,
        estimated_waste_collected_kg=round(total_waste_collected, 2),
        average_completion_rate_pct=completion_rate,
        simulated_battery_level_pct=bat,
        simulated_bin_capacity_pct=bin_fill,
        active_water_body=lake_dict,
        mode="Demo Mode (Synthetic Data)"
    )

@router.get("/activity")
def get_dashboard_activity(db: Session = Depends(get_db)):
    recent_missions = db.query(MissionPlan).order_by(MissionPlan.created_at.desc()).limit(5).all()
    recent_reports = db.query(WasteReport).order_by(WasteReport.observed_at.desc()).limit(5).all()
    priority_zones = db.query(Zone).order_by(Zone.priority_score.desc()).limit(6).all()
    recent_events = db.query(MissionEvent).order_by(MissionEvent.created_at.desc()).limit(8).all()

    return {
        "recent_missions": [
            {
                "id": m.id,
                "name": m.name,
                "status": m.status,
                "distance_km": m.planned_distance_km,
                "duration_min": m.estimated_duration_minutes,
                "created_at": m.created_at.isoformat() if m.created_at else None
            } for m in recent_missions
        ],
        "recent_reports": [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "severity": r.severity,
                "status": r.report_status,
                "observed_at": r.observed_at.isoformat() if r.observed_at else None
            } for r in recent_reports
        ],
        "priority_zones": [
            {
                "id": z.id,
                "name": z.name,
                "priority_score": z.priority_score,
                "severity_score": z.severity_score,
                "waste_density_score": z.waste_density_score,
                "is_restricted": z.is_restricted
            } for z in priority_zones
        ],
        "recent_events": [
            {
                "id": e.id,
                "mission_id": e.mission_id,
                "event_type": e.event_type,
                "message": e.message,
                "created_at": e.created_at.isoformat() if e.created_at else None
            } for e in recent_events
        ]
    }
