import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Date, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    plan_type = Column(String, default="free")  # free, professional, enterprise
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # user, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    organization = relationship("Organization", back_populates="users")
    jobs = relationship("Job", back_populates="user")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    file_status = Column(String, default="pending")  # pending, processing, completed, failed
    download_url_xlsx = Column(String, nullable=True)
    
    opening_balance = Column(Numeric(15, 2), nullable=True)
    closing_balance = Column(Numeric(15, 2), nullable=True)
    audit_passed = Column(Boolean, default=False)
    txn_count = Column(Integer, default=0)
    
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="jobs")
    transactions = relationship("Transaction", back_populates="job", cascade="all, delete-orphan")
    exceptions = relationship("ExceptionRecord", back_populates="job", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    transaction_date = Column(Date, nullable=False, index=True)
    narration = Column(String, nullable=False)
    reference_number = Column(String, nullable=True)
    debit = Column(Numeric(15, 2), nullable=True)
    credit = Column(Numeric(15, 2), nullable=True)
    closing_balance = Column(Numeric(15, 2), nullable=False)
    page_number = Column(Integer, nullable=False)

    job = relationship("Job", back_populates="transactions")


class ExceptionRecord(Base):
    __tablename__ = "exception_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    page_number = Column(Integer, nullable=False)
    row_content = Column(String, nullable=False)
    issue_details = Column(String, nullable=False)
    expected_format = Column(String, nullable=True)
    found_value = Column(String, nullable=True)

    job = relationship("Job", back_populates="exceptions")
