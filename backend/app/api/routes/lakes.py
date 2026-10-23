from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.api.deps import get_db
from backend.app.models.models import WaterBody, Zone
from backend.app.schemas.schemas import WaterBodyResponse, WaterBodyCreate, ZoneResponse

router = APIRouter(prefix="/lakes", tags=["Water Bodies"])

@router.get("", response_model=List[WaterBodyResponse])
def get_water_bodies(db: Session = Depends(get_db)):
    return db.query(WaterBody).all()

@router.get("/{lake_id}", response_model=WaterBodyResponse)
def get_water_body(lake_id: str, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Water body not found")
    return lake

@router.get("/{lake_id}/zones", response_model=List[ZoneResponse])
def get_lake_zones(lake_id: str, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == lake_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Water body not found")
    return db.query(Zone).filter(Zone.water_body_id == lake_id).all()

@router.post("", response_model=WaterBodyResponse)
def create_water_body(payload: WaterBodyCreate, db: Session = Depends(get_db)):
    lake = WaterBody(
        name=payload.name,
        description=payload.description,
        boundary_geojson=payload.boundary_geojson,
        launch_point_lat=payload.launch_point_lat,
        launch_point_lng=payload.launch_point_lng,
        data_source=payload.data_source or "user_created"
    )
    db.add(lake)
    db.commit()
    db.refresh(lake)
    return lake
