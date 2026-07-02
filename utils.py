import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import Optional
from config import config
from loguru import logger

def parse_amount(val: Optional[str]) -> Optional[Decimal]:
    """
    Parses a string amount into a Decimal.
    Removes currency symbols, commas, spaces.
    Handles negative numbers in formats like -123.45 or (123.45).
    Returns None if empty or not a valid number.
    """
    if val is None:
        return None
        
    cleaned = val.strip().replace(",", "")
    if not cleaned or cleaned == "-" or cleaned == ".":
        return None
        
    # Check if enclosed in parentheses (often indicates negative or debit)
    is_negative = False
    if cleaned.startswith("(") and cleaned.endswith(")"):
        is_negative = True
        cleaned = cleaned[1:-1]
        
    # Remove common currency symbols (INR, $, etc.)
    cleaned = re.sub(r"[^\d\.\-\+]", "", cleaned)
    
    if not cleaned:
        return None
        
    try:
        dec = Decimal(cleaned)
        if is_negative:
            dec = -dec
        return dec
    except InvalidOperation:
        logger.warning(f"Could not parse amount string: '{val}' (cleaned: '{cleaned}')")
        return None

def parse_date(val: Optional[str]) -> Optional[date]:
    """
    Parses a string date using config.DATE_FORMATS.
    Returns datetime.date if successful, None otherwise.
    """
    if not val:
        return None
        
    cleaned = val.strip()
    
    for fmt in config.DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
            
    logger.warning(f"Could not parse date string: '{val}' against formats {config.DATE_FORMATS}")
    return None

def sanitize_text(val: Optional[str]) -> str:
    """
    Sanitizes text by removing extra spaces, tabs, and newlines.
    """
    if not val:
        return ""
    # Replace multiple whitespaces/newlines with a single space
    return re.sub(r"\s+", " ", val).strip()
