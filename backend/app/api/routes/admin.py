from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import User, Profile
from backend.app.schemas.schemas import UserResponse, UserRoleUpdate
from backend.app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Management"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    List all registered platform users.
    Accessible strictly to Administrators.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(u) for u in users]

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Update a user's role (e.g. promote operator to admin or demote).
    Enforces that ordinary operators cannot access this route.
    Guards against removing the last active administrator.
    """
    target_role = payload.role.strip().lower()
    valid_roles = ["admin", "operator", "guest"]
    if target_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{payload.role}'. Must be one of: {valid_roles}"
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Prevent demoting the last active admin
    if target_user.role == "admin" and target_role != "admin":
        active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()
        if active_admins <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the last remaining active administrator."
            )

    target_user.role = target_role
    
    # Sync with profile table if exists
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if profile:
        profile.role = target_role

    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)

@router.patch("/users/{user_id}/status", response_model=UserResponse)
def toggle_user_active_status(
    user_id: str,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Toggle a user's active status. Admins cannot deactivate their own account."""
    if current_user.id == user_id and not active:
        raise HTTPException(
            status_code=400,
            detail="Administrators cannot deactivate their own active account."
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_user.is_active = active
    db.commit()
    db.refresh(target_user)
    return UserResponse.model_validate(target_user)
