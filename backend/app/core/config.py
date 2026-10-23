import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "LakeClean Mission Control"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Supabase (optional)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Mission & Boat simulation defaults
    DEFAULT_BOAT_SPEED_KMH: float = 4.5  # km/h
    BATTERY_DRAIN_PER_KM: float = 12.0    # % per km travelled
    BATTERY_DRAIN_PER_ZONE: float = 4.0   # % per zone cleaned
    CLEANING_TIME_PER_ZONE_MINUTES: float = 12.0
    DEFAULT_BATTERY_RESERVE_PCT: float = 20.0
    MAX_BIN_CAPACITY_KG: float = 40.0
    
    # Auth & Security
    JWT_SECRET: str = "lakeclean-super-secure-mission-control-jwt-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    INITIAL_ADMIN_EMAIL: Optional[str] = None
    INITIAL_ADMIN_PASSWORD: Optional[str] = None
    INITIAL_ADMIN_NAME: str = "System Administrator"
    
    # SMTP / Email settings (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "no-reply@lakeclean.demo"

    # Default Priority Scoring Weights
    WEIGHT_SEVERITY: float = 0.35
    WEIGHT_DENSITY: float = 0.25
    WEIGHT_FRESHNESS: float = 0.20
    WEIGHT_RUNOFF: float = 0.20
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

def get_database_url() -> str:
    if settings.DATABASE_URL:
        url = settings.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    # Default to local SQLite fallback
    # Place sqlite db in backend directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(backend_dir, "lakeclean.db")
    return f"sqlite:///{db_path}"
