import pytest
from datetime import date
from decimal import Decimal
from transaction_parser import parse_transactions_stream
from models import Transaction

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
