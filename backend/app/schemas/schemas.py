from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import uuid

# --- Authentication ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    organization_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Transactions & Exceptions ---
class TransactionResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    transaction_date: date
    narration: str
    reference_number: Optional[str] = None
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    closing_balance: Decimal
    page_number: int

    class Config:
        from_attributes = True

class ExceptionResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    page_number: int
    row_content: str
    issue_details: str
    expected_format: Optional[str] = None
    found_value: Optional[str] = None

    class Config:
        from_attributes = True

# --- Jobs ---
class JobResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    original_filename: str
    file_status: str
    download_url_xlsx: Optional[str] = None
    opening_balance: Optional[Decimal] = None
    closing_balance: Optional[Decimal] = None
    audit_passed: bool
    txn_count: int
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Stats ---
class MetricSummary(BaseModel):
    metric: str
    value: str

class DashboardStats(BaseModel):
    total_jobs: int
    successful_jobs: int
    failed_jobs: int
    total_transactions: int
    audit_pass_rate: float
    recent_jobs: List[JobResponse]

    class Config:
        from_attributes = True
