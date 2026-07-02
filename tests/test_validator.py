import pytest
from datetime import date
from decimal import Decimal
from models import Transaction, ExceptionRecord
from validator import validate_transactions

def test_validator_pass():
    transactions = [
        Transaction(
            date=date(2026, 1, 1),
            narration="STARTING",
            debit=None,
            credit=Decimal("500.00"),
            closing_balance=Decimal("1500.00"),
            page=1
        ),
        Transaction(
            date=date(2026, 1, 2),
            narration="BUY SHOP",
            debit=Decimal("200.00"),
            credit=None,
            closing_balance=Decimal("1300.00"),
            page=1
        )
    ]
    
    summary, exceptions = validate_transactions(transactions, [], 1)
    
    assert summary.validation_status == "PASS"
    assert summary.opening_balance == Decimal("1000.00")
    assert summary.calculated_closing_balance == Decimal("1300.00")
    assert summary.pdf_closing_balance == Decimal("1300.00")
    assert summary.balance_match is True
    assert len(exceptions) == 0

def test_validator_balance_fail():
    # Transaction 2 has incorrect closing balance (should be 1300.00, but is 1400.00)
    transactions = [
        Transaction(
            date=date(2026, 1, 1),
            narration="STARTING",
            debit=None,
            credit=Decimal("500.00"),
            closing_balance=Decimal("1500.00"),
            page=1
        ),
        Transaction(
            date=date(2026, 1, 2),
            narration="BUY SHOP",
            debit=Decimal("200.00"),
            credit=None,
            closing_balance=Decimal("1400.00"),  # Error here
            page=1
        )
    ]
    
    summary, exceptions = validate_transactions(transactions, [], 1)
    
    assert summary.validation_status == "FAIL"
    assert summary.balance_match is False
    assert len(exceptions) == 1
    assert "Running balance verification failed" in exceptions[0].issue

def test_validator_duplicates():
    # Two identical transactions
    transactions = [
        Transaction(
            date=date(2026, 1, 1),
            narration="STARTING",
            reference_number="TXN001",
            debit=None,
            credit=Decimal("500.00"),
            closing_balance=Decimal("1500.00"),
            page=1
        ),
        Transaction(
            date=date(2026, 1, 1),
            narration="STARTING",
            reference_number="TXN001",
            debit=None,
            credit=Decimal("500.00"),
            closing_balance=Decimal("1500.00"),
            page=1
        )
    ]
    
    summary, exceptions = validate_transactions(transactions, [], 1)
    
    assert summary.duplicate_rows == 1
    assert len(exceptions) == 2
    assert any("Duplicate transaction detected" in e.issue for e in exceptions)
    assert any("Running balance verification failed" in e.issue for e in exceptions)
