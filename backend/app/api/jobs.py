from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from loguru import logger

from app.core.database import get_db
from app.core.config import settings
from app.crud import crud
from app.schemas import schemas
from app.services import security
from app.worker.tasks import process_bank_statement

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/upload", response_model=schemas.JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_statement(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    """
    Uploads a bank statement PDF, saves it securely, creates a db entry,
    and dispatches an async background task (via Celery or FastAPI BackgroundTasks).
    """
    # 1. Validate file type and extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF bank statements are supported."
        )
        
    # 2. Setup job record
    job_id = uuid.uuid4()
    job_id_str = str(job_id)
    
    file_path = os.path.join(settings.UPLOAD_DIR, f"{job_id_str}.pdf")
    
    # 3. Stream upload contents and enforce file size checks
    size_counter = 0
    try:
        with open(file_path, "wb") as f:
            while content := await file.read(1024 * 1024):  # Read in 1MB chunks
                size_counter += len(content)
                if size_counter > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                    # Clean up file and abort
                    f.close()
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                f.write(content)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.exception("Failed to write uploaded file.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded statement file."
        )

    # 4. Create Job in database
    db_job = crud.create_job(db, user_id=current_user.id, filename=file.filename)
    # Ensure database job matches our generated job_id
    db_job.id = job_id
    db.commit()
    db.refresh(db_job)

    # 5. Dispatch async background task (Hybrid Fallback)
    use_celery = False
    try:
        import redis
        r = redis.Redis.from_url(settings.REDIS_URL)
        r.ping()
        use_celery = True
    except Exception:
        logger.warning("Redis is not available. Falling back to FastAPI BackgroundTasks thread.")

    if use_celery:
        process_bank_statement.delay(job_id_str, file_path)
    else:
        # Call process_bank_statement directly using FastAPI BackgroundTasks
        background_tasks.add_task(process_bank_statement, job_id_str, file_path)
    
    logger.info(f"Dispatched job {job_id_str} for processing | User: {current_user.email}")
    return db_job

@router.get("", response_model=List[schemas.JobResponse])
def list_jobs(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    """
    Returns pagination-supported job histories for the authenticated user.
    """
    return crud.get_jobs_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    """
    Computes dashboard analytics, totals, and audit pass rates.
    """
    stats_data = crud.get_dashboard_statistics(db, user_id=current_user.id)
    return stats_data

@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job_details(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    """
    Retrieves status and metadata details for a specific processing job.
    """
    db_job = crud.get_job(db, job_id)
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    
    # Secure row resource check
    if db_job.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    return db_job

@router.get("/{job_id}/download")
def download_job_xlsx(
    job_id: uuid.UUID,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    header_auth: Optional[str] = Depends(security.oauth2_scheme_optional)
):
    """
    Downloads the parsed Excel file. File must exist on disk.
    Supports JWT authorization via header or URL query parameter token fallback.
    """
    # 1. Resolve token
    auth_token = header_auth if header_auth else token
    if not auth_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is missing."
        )
        
    # 2. Decode and verify token
    try:
        from jose import jwt
        payload = jwt.decode(auth_token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise Exception()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is invalid or expired."
        )
        
    current_user = crud.get_user_by_email(db, email=email)
    if not current_user or not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is inactive or user not found."
        )

    # 3. Retrieve Job
    db_job = crud.get_job(db, job_id)
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
        
    # 4. Enforce resource access control
    if db_job.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    if db_job.file_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is not ready for download. Current status: {db_job.file_status}"
        )
        
    xlsx_path = os.path.join(settings.EXCEL_OUTPUT_DIR, f"{str(job_id)}.xlsx")
    if not os.path.exists(xlsx_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The parsed output spreadsheet file has expired or was pruned."
        )
        
    safe_filename = db_job.original_filename.rsplit(".", 1)[0] + ".xlsx"
    return FileResponse(
        path=xlsx_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=safe_filename
    )
