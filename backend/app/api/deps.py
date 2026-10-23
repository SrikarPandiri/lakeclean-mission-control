from typing import List, Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import User
from backend.app.core.security import decode_access_token

# auto_error=False allows us to provide clear custom error responses or guest fallbacks
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer JWT token and resolve current authenticated user or guest session."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
    
    user_id: Optional[str] = payload.get("sub")
    role: str = payload.get("role", "operator")
    
    if not user_id:
        raise credentials_exception
    
    # Handle guest sessions
    if role == "guest" or user_id.startswith("guest-"):
        # Synthesize a safe, read/simulation-only guest user object
        guest_user = User(
            id=user_id,
            email=payload.get("email", "guest@lakeclean.demo"),
            display_name=payload.get("display_name", "Guest Explorer"),
            role="guest",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        return guest_user

    # Database lookup for registered users (operator / admin)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )
        
    return user

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Resolve user if valid token exists, otherwise return None without raising 401."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None

def require_role(allowed_roles: List[str]):
    """Dependency factory to enforce specific user roles at the API layer."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Access denied for role '{current_user.role}'. Required one of: {allowed_roles}"
            )
        return current_user
    return role_checker

__all__ = ["get_db", "get_current_user", "get_optional_user", "require_role"]
