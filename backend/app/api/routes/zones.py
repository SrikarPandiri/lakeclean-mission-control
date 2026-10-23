from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.api.deps import get_db
from backend.app.models.models import Zone, WaterBody
from backend.app.schemas.schemas import ZoneResponse, ZoneCreate, ZoneUpdate
from backend.app.services.scoring import calculate_priority_score

router = APIRouter(prefix="/zones", tags=["Zones"])

@router.get("", response_model=List[ZoneResponse])
def get_all_zones(water_body_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Zone)
    if water_body_id:
        query = query.filter(Zone.water_body_id == water_body_id)
    return query.order_by(Zone.priority_score.desc()).all()

@router.get("/{zone_id}", response_model=ZoneResponse)
def get_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

@router.post("", response_model=ZoneResponse)
def create_zone(payload: ZoneCreate, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == payload.water_body_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Referenced water body not found")

    score_result = calculate_priority_score(
        severity=payload.severity_score,
        waste_density=payload.waste_density_score,
        runoff_exposure=payload.runoff_exposure_score
    )

    zone = Zone(
        water_body_id=payload.water_body_id,
        name=payload.name,
        description=payload.description,
        geometry_geojson=payload.geometry_geojson,
        severity_score=payload.severity_score,
        waste_density_score=payload.waste_density_score,
        runoff_exposure_score=payload.runoff_exposure_score,
        priority_score=score_result["priority_score"],
        is_restricted=payload.is_restricted,
        data_source=payload.data_source or "user_created"
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.patch("/{zone_id}", response_model=ZoneResponse)
def update_zone(zone_id: str, payload: ZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    if payload.name is not None:
        zone.name = payload.name
    if payload.description is not None:
        zone.description = payload.description
    if payload.severity_score is not None:
        zone.severity_score = payload.severity_score
    if payload.waste_density_score is not None:
        zone.waste_density_score = payload.waste_density_score
    if payload.runoff_exposure_score is not None:
        zone.runoff_exposure_score = payload.runoff_exposure_score
    if payload.is_restricted is not None:
        zone.is_restricted = payload.is_restricted

    # Recalculate priority score
    score_result = calculate_priority_score(
        severity=zone.severity_score,
        waste_density=zone.waste_density_score,
        runoff_exposure=zone.runoff_exposure_score
    )
    zone.priority_score = score_result["priority_score"]

    db.commit()
    db.refresh(zone)
    return zone
