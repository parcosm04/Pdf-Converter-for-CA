from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, model_validator
import hashlib

class Transaction(BaseModel):
    date: date
    narration: str
    reference_number: Optional[str] = None
    value_date: Optional[date] = None
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    closing_balance: Decimal
    page: int = Field(..., description="The PDF page this transaction was found on")

    @model_validator(mode="after")
    def validate_amounts(self) -> "Transaction":
        if self.debit is not None and self.credit is not None:
            raise ValueError("Debit and Credit cannot both contain values simultaneously.")
        if self.debit is None and self.credit is None:
            raise ValueError("Transaction must have either a Debit or Credit amount.")
        if self.debit is not None and self.debit < Decimal("0"):
            raise ValueError("Debit amount must be non-negative.")
        if self.credit is not None and self.credit < Decimal("0"):
            raise ValueError("Credit amount must be non-negative.")
        return self

    def get_hash(self) -> str:
        """
        Generate a unique hash for duplicate detection based on specific fields:
        date, reference_number, debit, credit, closing_balance.
        """
        ref = self.reference_number or ""
        deb = str(self.debit) if self.debit is not None else ""
        crd = str(self.credit) if self.credit is not None else ""
        raw = f"{self.date}|{ref}|{deb}|{crd}|{self.closing_balance}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

class ExceptionRecord(BaseModel):
    page: int
    transaction: str = Field(..., description="String description of the transaction context")
    issue: str
    expected: Optional[str] = None
    found: Optional[str] = None

class ValidationSummary(BaseModel):
    pages_processed: int
    transactions_extracted: int
    opening_balance: Decimal
    calculated_closing_balance: Decimal
    pdf_closing_balance: Decimal
    balance_match: bool
    total_debit: Decimal
    total_credit: Decimal
    duplicate_rows: int
    missing_rows: int
    broken_narrations: int
    validation_status: str  # e.g., "PASS", "FAIL"
