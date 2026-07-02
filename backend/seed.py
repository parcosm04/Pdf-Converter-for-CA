from app.core.database import SessionLocal, engine
from app.models.models import Base
from app.models.models import User, Organization
from app.services.security import get_password_hash
from loguru import logger

def seed():
    # Auto-initialize database tables in target DB
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if default organization exists
        org = db.query(Organization).filter(Organization.name == "Demo Workspace").first()
        if not org:
            org = Organization(name="Demo Workspace", plan_type="enterprise")
            db.add(org)
            db.commit()
            db.refresh(org)
            logger.info("Created Demo Workspace organization.")
            
        # Check if default user exists
        user = db.query(User).filter(User.email == "user@ubsp.com").first()
        if not user:
            hashed_pass = get_password_hash("Password123")
            user = User(
                email="user@ubsp.com",
                hashed_password=hashed_pass,
                role="admin",
                organization_id=org.id
            )
            db.add(user)
            db.commit()
            logger.info("Seeded default user account: user@ubsp.com / Password123")
        else:
            logger.info("Default user account user@ubsp.com already exists.")
            
    except Exception as e:
        logger.error(f"Seeding failed: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
