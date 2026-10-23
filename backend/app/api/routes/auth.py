import re
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import User, Profile
from backend.app.schemas.schemas import (
    UserCreate,
    UserResponse,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_reset_token,
)
from backend.app.core.config import settings
from backend.app.api.deps import get_current_user

logger = logging.getLogger("lakeclean.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account. 
    By default, public registration always assigns the 'operator' role to prevent privilege escalation.
    """
    clean_email = payload.email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(status_code=400, detail="Invalid email address format.")
    
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    clean_name = payload.display_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Display name is required.")

    # Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash password and create operator user
    hashed = hash_password(payload.password)
    new_user = User(
        email=clean_email,
        hashed_password=hashed,
        display_name=clean_name,
        role="operator",  # Never allow public registration as admin
        is_active=True,
    )
    db.add(new_user)
    
    # Also sync profile entry for database consistency
    profile = Profile(
        id=new_user.id,
        display_name=clean_name,
        role="operator"
    )
    db.add(profile)
    db.commit()
    db.refresh(new_user)

    # Issue JWT token
    token = create_access_token(data={
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "display_name": new_user.display_name
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password and return access token."""
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact your mission administrator."
        )

    # Extended expiry for remember-me
    expires = timedelta(days=7) if payload.remember_me else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "display_name": user.display_name
        },
        expires_delta=expires
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/guest", response_model=TokenResponse)
def continue_as_guest():
    """
    Issue a safe guest session token without requiring credentials.
    Enables exploring the dashboard, map, and running synthetic simulations in Guest Demo Mode.
    """
    guest_uuid = f"guest-{uuid.uuid4().hex[:12]}"
    guest_data = {
        "sub": guest_uuid,
        "email": "guest@lakeclean.demo",
        "role": "guest",
        "display_name": "Guest Explorer"
    }

    # Issue token valid for 24 hours
    token = create_access_token(data=guest_data, expires_delta=timedelta(hours=24))

    guest_user_response = UserResponse(
        id=guest_uuid,
        email="guest@lakeclean.demo",
        display_name="Guest Explorer",
        role="guest",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=guest_user_response
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the profile and role details of the currently authenticated user or guest."""
    return UserResponse.model_validate(current_user)

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset workflow.
    Generates a secure single-use token and returns a friendly confirmation.
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    reset_token = None
    if user:
        reset_token = generate_reset_token()
        user.reset_token = reset_token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        logger.info(f"Password reset token issued for user {clean_email}")

    response = {
        "message": "If this email is registered in LakeClean Mission Control, instructions to reset your password have been issued.",
        "email": clean_email
    }

    # For development and demonstration convenience, provide reset token directly if not in production
    if settings.ENVIRONMENT != "production" and reset_token:
        response["demo_reset_token"] = reset_token
        response["instructions"] = "In demo environment, copy this token into the Reset Password screen."

    return response

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate reset token and set a new password."""
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    clean_token = payload.token.strip()
    user = db.query(User).filter(User.reset_token == clean_token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or unrecognized password reset token.")

    if user.reset_token_expires:
        # Check expiration
        expires = user.reset_token_expires
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="Password reset token has expired. Please request a new one.")

    # Update password and clear token
    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {
        "message": "Password updated successfully. You can now log in with your new credentials."
    }
