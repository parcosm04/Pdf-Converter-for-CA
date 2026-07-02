import os
import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from loguru import logger

# Retrieve PostgreSQL URL from environment variables, fallback to local sqlite for testing if not set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///test.db")

# In production we use PostgreSQL, for development/testing sqlite is allowed as fallback
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Auto-adjust postgresql schema for pg8000 on cloud deployments (Vercel)
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)

    # pg8000 requires explicit SSL context for cloud-hosted databases (Supabase, Neon, etc.)
    ssl_context = ssl.create_default_context()
    
    engine = create_engine(
        DATABASE_URL,
        connect_args={"ssl_context": ssl_context},
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    FastAPI dependency yielding a database session and closing it upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
