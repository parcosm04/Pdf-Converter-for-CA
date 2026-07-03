import re
from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfig(BaseSettings):
    # Regex rules
    NEW_TRANSACTION_REGEX: str = r"(?i)^(?:\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{1,2}[-/\.\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\.\s]+\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})"
    
    # Valid date patterns to attempt parsing (after month normalization)
    DATE_FORMATS: List[str] = [
        "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
        "%Y-%m-%d",
        "%d %m %Y", "%d %m %y",
        "%m %d, %Y", "%m %d, %y",
        "%m %d %Y", "%m %d %y",
    ]
    
    # Column mapping keywords (case-insensitive fuzzy matches / sub-string checks)
    COLUMN_MAPPINGS: Dict[str, List[str]] = {
        "date": ["date", "txn date", "trans date", "transaction date", "post date", "booking date", "tran date", "post_date"],
        "narration": ["narration", "description", "particulars", "remarks", "transaction details", "transaction description", "details", "narrative", "description of transaction"],
        "reference_number": ["reference", "ref no", "cheque", "chq", "ref", "instrument", "txn id", "transaction id", "cheque/ref. no", "chq/ref", "instrument no", "ref. no.", "ref.no", "chq.no.", "cheque no.", "cheque number", "ref/chq", "cheque/ref", "doc. no."],
        "value_date": ["value date", "val date", "vdate", "value_date", "val.date", "val dt"],
        "debit": ["debit", "withdrawal", "dr", "withdrawals", "debit amount", "payment", "payments", "amount (dr)", "withdrawals (dr)", "debit (dr)", "out"],
        "credit": ["credit", "deposit", "cr", "deposits", "credit amount", "receipt", "receipts", "amount (cr)", "deposits (cr)", "credit (cr)", "in"],
        "closing_balance": ["balance", "closing balance", "running balance", "bal", "closing", "balance (inr)", "balance(inr)", "running bal", "closing bal", "bal (inr)"],
        "amount": ["amount", "amt", "transaction amount", "amount (inr)", "amount(inr)", "net amount", "amount (rs.)", "amount (rs)", "amt (inr)"],
        "type": ["type", "dr/cr", "d/c", "indicator", "cr/dr", "txn type", "transaction type", "cr / dr"]
    }
    
    # PDF Extraction thresholds
    Y_TOLERANCE: float = 3.0  # Points variance to group characters into the same row
    X_TOLERANCE: float = 5.0  # Points tolerance for column boundary alignment
    
    # Excel Style Rules
    EXCEL_HEADER_BG: str = "1B365D"  # Dark navy blue
    EXCEL_HEADER_FG: str = "FFFFFF"  # White
    EXCEL_ROW_ALT_BG: str = "F2F5F8"  # Very light grey-blue for alternating rows
    EXCEL_FONT_NAME: str = "Segoe UI"
    
    # Log levels
    LOG_FILE: str = "logs/bank_parser.log"
    LOG_LEVEL: str = "DEBUG"
    
    # Model config
    model_config = SettingsConfigDict(env_prefix="PARSER_")

# Create a singleton instance
config = AppConfig()
