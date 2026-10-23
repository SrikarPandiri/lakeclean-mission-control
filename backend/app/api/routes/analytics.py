from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from backend.app.api.deps import get_db
from backend.app.models.models import MissionPlan, WasteReport, Zone, CleanupRecord
from backend.app.schemas.schemas import AnalyticsOverview

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db)):
    # Missions by status
    status_counts = {}
    for st in ["PLANNED", "RUNNING", "PAUSED", "COMPLETED", "ABORTED"]:
        status_counts[st] = db.query(MissionPlan).filter(MissionPlan.status == st).count()

    # Waste reports by category
    categories = db.query(WasteReport.category, func.count(WasteReport.id)).group_by(WasteReport.category).all()
    waste_by_cat = {cat: count for cat, count in categories}

    # Priority distribution (Low <35, Medium 35-55, High 55-75, Critical >=75)
    crit = db.query(Zone).filter(Zone.priority_score >= 75.0).count()
    high = db.query(Zone).filter(Zone.priority_score >= 55.0, Zone.priority_score < 75.0).count()
    med = db.query(Zone).filter(Zone.priority_score >= 35.0, Zone.priority_score < 55.0).count()
    low = db.query(Zone).filter(Zone.priority_score < 35.0).count()
    priority_dist = {
        "Critical (≥75)": crit,
        "High (55-74)": high,
        "Medium (35-54)": med,
        "Low (<35)": low
    }

    # Zones completed vs incomplete
    cleaned_zone_ids = set()
    completed_records = db.query(CleanupRecord.zone_id).all()
    for rec in completed_records:
        if rec[0]:
            cleaned_zone_ids.add(rec[0])
    
    total_zones = db.query(Zone).count()
    completed_zones_count = len(cleaned_zone_ids)
    incomplete_zones_count = max(0, total_zones - completed_zones_count)
    zone_status = {
        "Cleaned / Surveyed": completed_zones_count,
        "Pending Cleaning": incomplete_zones_count
    }

    # Total distance & waste
    total_distance = db.query(func.sum(MissionPlan.planned_distance_km)).filter(MissionPlan.status == "COMPLETED").scalar() or 0.0
    total_waste = db.query(func.sum(CleanupRecord.estimated_waste_collected)).scalar() or 0.0

    # Recent missions performance
    recent_m = db.query(MissionPlan).order_by(MissionPlan.created_at.desc()).limit(6).all()
    perf = [
        {
            "name": m.name[:25] + ("..." if len(m.name) > 25 else ""),
            "distance_km": m.planned_distance_km,
            "duration_min": m.estimated_duration_minutes,
            "battery_used_pct": round(m.initial_battery_pct - m.current_battery_pct, 1),
            "status": m.status
        } for m in recent_m
    ]

    return AnalyticsOverview(
        missions_by_status=status_counts,
        waste_by_category=waste_by_cat,
        priority_distribution=priority_dist,
        zones_completed_vs_incomplete=zone_status,
        total_simulated_distance_km=round(total_distance, 2),
        total_simulated_waste_kg=round(total_waste, 2),
        recent_performance=perf
    )
