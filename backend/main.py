import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# Add current backend dir and parser path to sys.path so all imports resolve correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
parser_dir = os.path.abspath(os.path.join(current_dir, "app", "services", "parser"))
if parser_dir not in sys.path:
    sys.path.insert(0, parser_dir)


from app.core.config import settings
from app.core.database import engine
from app.models.models import Base
from app.api import auth, jobs

# Create database tables automatically if using a local sqlite engine (useful for tests/quick dev)
if settings.DATABASE_URL.startswith("sqlite"):
    logger.info("Initializing sqlite database tables...")
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include endpoint modules
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)

@app.get("/")
def root_endpoint():
    """
    Service health check endpoint.
    """
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "version": settings.PROJECT_VERSION
    }
