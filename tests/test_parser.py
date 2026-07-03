import pytest
from datetime import date
from decimal import Decimal
from transaction_parser import parse_transactions_stream
from models import Transaction
from utils import parse_amount

def test_parse_transactions_stream():
    # 2 pages of data:
    # Page 1 has 1 transaction with a multiline narration.
    # Page 2 has 1 transaction continuing narration across page boundary, then 1 new transaction.
    pages_rows = [
        (1, [
            {
                "date": "01/01/2026",
                "narration": "INTEREST PAY",
                "reference_number": "TXN100",
                "value_date": "01/01/2026",
                "debit": "",
                "credit": "150.00",
                "closing_balance": "1000.00"
            },
            {
                "date": "",
                "narration": "FOR DEC 2025",
                "reference_number": "",
                "value_date": "",
                "debit": "",
                "credit": "",
                "closing_balance": ""
            }
        ]),
        (2, [
            {
                "date": "",
                "narration": "COMPLETION",
                "reference_number": "",
                "value_date": "",
                "debit": "",
                "credit": "",
                "closing_balance": ""
            },
            {
                "date": "03/01/2026",
                "narration": "WITHDRAW ATM",
                "reference_number": "TXN101",
                "value_date": "03/01/2026",
                "debit": "100.00",
                "credit": "",
                "closing_balance": "900.00"
            }
        ])
    ]
    
    txns, exceptions = parse_transactions_stream(pages_rows)
    
    assert len(exceptions) == 0
    assert len(txns) == 2
    
    # Check narration merging on the first transaction (which spanned across page 1 and page 2)
    assert txns[0].date == date(2026, 1, 1)
    assert txns[0].narration == "INTEREST PAY FOR DEC 2025 COMPLETION"
    assert txns[0].credit == Decimal("150.00")
    assert txns[0].closing_balance == Decimal("1000.00")
    assert txns[0].page == 1
    
    # Check second transaction
    assert txns[1].date == date(2026, 1, 3)
    assert txns[1].narration == "WITHDRAW ATM"
    assert txns[1].debit == Decimal("100.00")
    assert txns[1].closing_balance == Decimal("900.00")
    assert txns[1].page == 2

def test_parse_single_amount_and_type_column():
    pages_rows = [
        (1, [
            {
                "date": "01/01/2026",
                "narration": "ATM WITHDRAWAL",
                "amount": "200.00",
                "type": "Dr",
                "closing_balance": "800.00"
            },
            {
                "date": "02/01/2026",
                "narration": "SALARY CREDIT",
                "amount": "1500.00",
                "type": "Cr",
                "closing_balance": "2300.00"
            },
            {
                "date": "03/01/2026",
                "narration": "ONLINE SHOPPING",
                "amount": "-50.00",
                "type": "",
                "closing_balance": "2250.00"
            },
            {
                "date": "04/01/2026",
                "narration": "INTEREST",
                "amount": "5.50+",
                "type": "",
                "closing_balance": "2255.50"
            }
        ])
    ]
    txns, exceptions = parse_transactions_stream(pages_rows)
    assert len(exceptions) == 0
    assert len(txns) == 4
    
    assert txns[0].debit == Decimal("200.00")
    assert txns[0].credit is None
    
    assert txns[1].credit == Decimal("1500.00")
    assert txns[1].debit is None
    
    assert txns[2].debit == Decimal("50.00")
    assert txns[2].credit is None
    
    assert txns[3].credit == Decimal("5.50")
    assert txns[3].debit is None

def test_parse_alphabetic_month_dates():
    pages_rows = [
        (1, [
            {
                "date": "1-Jun-2026",
                "narration": "TEST 1",
                "debit": "10.00",
                "closing_balance": "100.00"
            },
            {
                "date": "Jun 02, 2026",
                "narration": "TEST 2",
                "credit": "20.00",
                "closing_balance": "120.00"
            },
            {
                "date": "03 Jun 26",
                "narration": "TEST 3",
                "credit": "30.00",
                "closing_balance": "150.00"
            }
        ])
    ]
    txns, exceptions = parse_transactions_stream(pages_rows)
    assert len(exceptions) == 0
    assert len(txns) == 3
    assert txns[0].date == date(2026, 6, 1)
    assert txns[1].date == date(2026, 6, 2)
    assert txns[2].date == date(2026, 6, 3)

def test_parse_amount_dr_cr():
    assert parse_amount("278.23 Cr") == Decimal("278.23")
    assert parse_amount("63.23 Cr") == Decimal("63.23")
    assert parse_amount("100.50 Dr") == Decimal("-100.50")
    assert parse_amount("50.00 DR") == Decimal("-50.00")
