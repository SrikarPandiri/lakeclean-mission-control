from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.api.deps import get_db, get_optional_user, require_role
from backend.app.models.models import WasteReport, WaterBody, Zone, User
from backend.app.schemas.schemas import WasteReportResponse, WasteReportCreate, WasteReportUpdate

router = APIRouter(prefix="/reports", tags=["Waste Reports"])

class VerificationPayload(BaseModel):
    verification_status: str  # VERIFIED or REJECTED

@router.get("", response_model=List[WasteReportResponse])
def get_reports(
    water_body_id: Optional[str] = None,
    zone_id: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    report_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(WasteReport)
    if water_body_id:
        query = query.filter(WasteReport.water_body_id == water_body_id)
    if zone_id:
        query = query.filter(WasteReport.zone_id == zone_id)
    if category:
        query = query.filter(WasteReport.category == category)
    if severity:
        query = query.filter(WasteReport.severity == severity)
    if report_status:
        query = query.filter(WasteReport.report_status == report_status)
    if search:
        query = query.filter(
            (WasteReport.title.ilike(f"%{search}%")) |
            (WasteReport.description.ilike(f"%{search}%"))
        )

    return query.order_by(WasteReport.observed_at.desc()).all()

@router.get("/{report_id}", response_model=WasteReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found")
    return report

@router.post("", response_model=WasteReportResponse)
def create_report(payload: WasteReportCreate, db: Session = Depends(get_db)):
    lake = db.query(WaterBody).filter(WaterBody.id == payload.water_body_id).first()
    if not lake:
        raise HTTPException(status_code=404, detail="Referenced water body not found")

    if payload.zone_id:
        zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
        if not zone:
            raise HTTPException(status_code=404, detail="Referenced zone not found")

    report = WasteReport(
        water_body_id=payload.water_body_id,
        zone_id=payload.zone_id,
        title=payload.title,
        category=payload.category,
        severity=payload.severity,
        estimated_density=payload.estimated_density,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        observed_at=payload.observed_at or datetime.utcnow(),
        verification_status=payload.verification_status or "UNVERIFIED",
        report_status=payload.report_status or "OPEN",
        photo_url=payload.photo_url,
        data_source=payload.data_source or "user_reported",
        created_by="Field Operator / Demo"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.patch("/{report_id}", response_model=WasteReportResponse)
def update_report(report_id: str, payload: WasteReportUpdate, db: Session = Depends(get_db)):
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found")

    if payload.title is not None:
        report.title = payload.title
    if payload.category is not None:
        report.category = payload.category
    if payload.severity is not None:
        report.severity = payload.severity
    if payload.estimated_density is not None:
        report.estimated_density = payload.estimated_density
    if payload.description is not None:
        report.description = payload.description
    if payload.verification_status is not None:
        report.verification_status = payload.verification_status
    if payload.report_status is not None:
        report.report_status = payload.report_status

    db.commit()
    db.refresh(report)
    return report

@router.patch("/{report_id}/verification", response_model=WasteReportResponse)
def verify_report(
    report_id: str, 
    payload: VerificationPayload, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # Enforce that Guests cannot triage or verify reports
    if current_user and current_user.role == "guest":
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: Guest users cannot verify or triage waste reports."
        )

    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found")

    if payload.verification_status not in ["VERIFIED", "REJECTED", "UNVERIFIED"]:
        raise HTTPException(status_code=400, detail="Invalid verification status")

    report.verification_status = payload.verification_status
    db.commit()
    db.refresh(report)
    return report

@router.delete("/{report_id}")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a waste report. Accessible strictly to Administrators."""
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found")

    db.delete(report)
    db.commit()
    return {"message": "Waste report deleted successfully", "id": report_id}

