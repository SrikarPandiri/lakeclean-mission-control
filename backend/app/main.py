import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.db.session import engine, Base, SessionLocal
from backend.app.db.seed_data import seed_database
from backend.app.core.security import hash_password
from backend.app.models.models import User, Profile
from backend.app.api.routes import (
    health,
    dashboard,
    lakes,
    zones,
    reports,
    missions,
    analytics,
    auth,
    admin,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & seed demo data if empty
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
        # Automatic Initial Admin Setup if configured via environment variables
        if settings.INITIAL_ADMIN_EMAIL and settings.INITIAL_ADMIN_PASSWORD:
            clean_email = settings.INITIAL_ADMIN_EMAIL.strip().lower()
            existing_admin = db.query(User).filter(User.email == clean_email).first()
            if not existing_admin:
                admin_user = User(
                    email=clean_email,
                    hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                    display_name=settings.INITIAL_ADMIN_NAME or "System Administrator",
                    role="admin",
                    is_active=True
                )
                db.add(admin_user)
                # Sync profile
                admin_profile = Profile(
                    id=admin_user.id,
                    display_name=admin_user.display_name,
                    role="admin"
                )
                db.add(admin_profile)
                db.commit()
    finally:
        db.close()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Mission Control, Autonomous Boat Planning & Lake Waste Management Simulation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(lakes.router, prefix="/api")
app.include_router(zones.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(missions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "service": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "mode": "Demo Mode (Synthetic Simulation)" if settings.DEMO_MODE else "Production"
    }
