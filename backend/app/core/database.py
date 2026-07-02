import os
from sqlalchemy import create_engine, pool
from sqlalchemy.orm import sessionmaker
from loguru import logger

# Retrieve PostgreSQL URL from environment variables, fallback to local sqlite for testing if not set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///test.db")
IS_SERVERLESS = os.getenv("VERCEL", "") == "1"

# In production we use PostgreSQL, for development/testing sqlite is allowed as fallback
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Fix common Heroku/Supabase postgres:// scheme (SQLAlchemy requires postgresql://)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # Ensure SSL is enabled for cloud-hosted databases
    if "sslmode" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = DATABASE_URL + separator + "sslmode=require"

    if IS_SERVERLESS:
        # Serverless: use NullPool (no persistent connections between invocations)
        engine = create_engine(
            DATABASE_URL,
            poolclass=pool.NullPool,
        )
    else:
        engine = create_engine(
            DATABASE_URL,
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
