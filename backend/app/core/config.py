from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "Universal Bank Statement Parser (UBSP)"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_JWT_KEY_MINIMUM_32_CHARACTERS_LONG_FOR_HMAC_SHA256")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database and Caching Broker
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ubsp")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Storage Configuration
    UPLOAD_DIR: str = "/tmp/uploads" if os.getenv("VERCEL") == "1" else os.getenv("UPLOAD_DIR", "storage/uploads")
    EXCEL_OUTPUT_DIR: str = "/tmp/outputs" if os.getenv("VERCEL") == "1" else os.getenv("EXCEL_OUTPUT_DIR", "storage/outputs")
    
    # Ingestion Rules
    MAX_FILE_SIZE_MB: int = 50  # Max PDF size allowed in MB
    FILE_RETENTION_HOURS: int = 24  # Time before uploaded & parsed files are permanently deleted

    
    model_config = SettingsConfigDict(env_prefix="UBSP_")

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.EXCEL_OUTPUT_DIR, exist_ok=True)
