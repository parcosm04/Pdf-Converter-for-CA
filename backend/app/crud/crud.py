from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.models.models import User, Organization, Job, Transaction, ExceptionRecord
from app.schemas import schemas

# --- Organization ---
def get_organization(db: Session, org_id: uuid.UUID) -> Optional[Organization]:
    return db.query(Organization).filter(Organization.id == org_id).first()

def create_organization(db: Session, name: str) -> Organization:
    db_org = Organization(name=name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

# --- User ---
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_schema: schemas.UserCreate, hashed_pass: str, org_id: Optional[uuid.UUID] = None) -> User:
    db_user = User(
        email=user_schema.email,
        hashed_password=hashed_pass,
        organization_id=org_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Job ---
def get_job(db: Session, job_id: uuid.UUID) -> Optional[Job]:
    return db.query(Job).filter(Job.id == job_id).first()

def get_jobs_by_user(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 20) -> List[Job]:
    return db.query(Job).filter(Job.user_id == user_id).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

def get_total_jobs_by_user(db: Session, user_id: uuid.UUID) -> int:
    return db.query(Job).filter(Job.user_id == user_id).count()

def create_job(db: Session, user_id: uuid.UUID, filename: str) -> Job:
    db_job = Job(
        user_id=user_id,
        original_filename=filename,
        file_status="pending"
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job_status(db: Session, job_id: uuid.UUID, status: str, error_msg: Optional[str] = None) -> Optional[Job]:
    db_job = get_job(db, job_id)
    if db_job:
        db_job.file_status = status
        if error_msg:
            db_job.error_message = error_msg
        db.commit()
        db.refresh(db_job)
    return db_job

# --- Transactions & ExceptionRecords ---
def create_transaction(db: Session, job_id: uuid.UUID, txn_data: dict) -> Transaction:
    db_txn = Transaction(job_id=job_id, **txn_data)
    db.add(db_txn)
    return db_txn

def create_exception_record(db: Session, job_id: uuid.UUID, exc_data: dict) -> ExceptionRecord:
    db_exc = ExceptionRecord(job_id=job_id, **exc_data)
    db.add(db_exc)
    return db_exc

# --- Dashboard Stats ---
def get_dashboard_statistics(db: Session, user_id: uuid.UUID) -> dict:
    total_jobs = db.query(Job).filter(Job.user_id == user_id).count()
    successful = db.query(Job).filter(Job.user_id == user_id, Job.file_status == "completed").count()
    failed = db.query(Job).filter(Job.user_id == user_id, Job.file_status == "failed").count()
    
    # Calculate sum of transactions
    jobs_subquery = db.query(Job.id).filter(Job.user_id == user_id).subquery()
    total_transactions = db.query(Transaction).filter(Transaction.job_id.in_(jobs_subquery)).count()
    
    pass_rate = 0.0
    if total_jobs > 0:
        audit_passed_count = db.query(Job).filter(Job.user_id == user_id, Job.audit_passed == True).count()
        pass_rate = float(audit_passed_count) / float(total_jobs)
        
    recent_jobs = get_jobs_by_user(db, user_id, limit=5)
    
    return {
        "total_jobs": total_jobs,
        "successful_jobs": successful,
        "failed_jobs": failed,
        "total_transactions": total_transactions,
        "audit_pass_rate": round(pass_rate * 100, 2),
        "recent_jobs": recent_jobs
    }
