import re
from typing import List, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfig(BaseSettings):
    # Regex rules
    NEW_TRANSACTION_REGEX: str = r"^\d{2}[-/\.]\d{2}[-/\.]\d{2,4}"
    
    # Valid date patterns to attempt parsing
    DATE_FORMATS: List[str] = [
        "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y",
        "%d/%m/%y", "%d-%m-%y", "%d.%m.%y",
        "%Y-%m-%d"
    ]
    
    # Column mapping keywords (case-insensitive fuzzy matches / sub-string checks)
    COLUMN_MAPPINGS: Dict[str, List[str]] = {
        "date": ["date", "txn date", "trans date", "transaction date", "post date"],
        "narration": ["narration", "description", "particulars", "remarks", "transaction details"],
        "reference_number": ["reference", "ref no", "cheque", "chq", "ref", "instrument", "txn id", "transaction id"],
        "value_date": ["value date", "val date", "vdate"],
        "debit": ["debit", "withdrawal", "dr", "withdrawals", "debit amount"],
        "credit": ["credit", "deposit", "cr", "deposits", "credit amount"],
        "closing_balance": ["balance", "closing balance", "running balance", "bal"]
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
