import pytest
from row_reconstructor import reconstruct_rows
from table_detector import TableDetector

def test_reconstruct_rows():
    # Define test words
    # Two rows: Row 1 has Date and Narration, Row 2 has Date, Narration, Debit, and Balance
    words = [
        # Row 1 (Y ~ 100)
        {"text": "01/02/24", "x0": 10, "x1": 50, "top": 100, "bottom": 110},
        {"text": "Monthly", "x0": 120, "x1": 160, "top": 101, "bottom": 111},
        {"text": "Salary", "x0": 165, "x1": 200, "top": 99, "bottom": 109},
        # Row 2 (Y ~ 130)
        {"text": "02/02/24", "x0": 10, "x1": 50, "top": 130, "bottom": 140},
        {"text": "ATM", "x0": 120, "x1": 140, "top": 130, "bottom": 140},
        {"text": "Cash", "x0": 145, "x1": 170, "top": 131, "bottom": 141},
        {"text": "500.00", "x0": 310, "x1": 350, "top": 130, "bottom": 140},
        {"text": "4,500.00", "x0": 450, "x1": 500, "top": 130, "bottom": 140}
    ]
    
    boundaries = [
        ("date", 0.0, 100.0),
        ("narration", 100.0, 300.0),
        ("debit", 300.0, 400.0),
        ("closing_balance", 400.0, 600.0)
    ]
    
    rows = reconstruct_rows(
        words=words,
        column_boundaries=boundaries,
        table_start_y=80,
        table_end_y=200,
        y_tolerance=3.0
    )
    
    assert len(rows) == 2
    
    # Assert Row 1 mapping
    assert rows[0]["date"] == "01/02/24"
    assert rows[0]["narration"] == "Monthly Salary"
    assert rows[0]["debit"] == ""
    assert rows[0]["closing_balance"] == ""
    
    # Assert Row 2 mapping
    assert rows[1]["date"] == "02/02/24"
    assert rows[1]["narration"] == "ATM Cash"
    assert rows[1]["debit"] == "500.00"
    assert rows[1]["closing_balance"] == "4,500.00"
