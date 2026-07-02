import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from loguru import logger

# Retrieve PostgreSQL URL from environment variables, fallback to local sqlite for testing if not set
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ubsp")

# In production we use PostgreSQL, for development/testing sqlite is allowed as fallback
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
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
