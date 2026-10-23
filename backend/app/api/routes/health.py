from fastapi import APIRouter
from datetime import datetime
from backend.app.core.config import settings, get_database_url

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health_status():
    db_url = get_database_url()
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "mode": "Demo Mode (Synthetic Simulation)" if settings.DEMO_MODE else "Live Production",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "SQLite (Local Fallback)" if "sqlite" in db_url else "Supabase PostgreSQL"
    }
