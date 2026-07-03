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
    cleaned_lower = cleaned.lower()
    if cleaned.startswith("(") and cleaned.endswith(")"):
        is_negative = True
        cleaned = cleaned[1:-1]
    elif "dr" in cleaned_lower or "debit" in cleaned_lower:
        is_negative = True
        
    # Remove common currency symbols (INR, $, etc.)
    cleaned = re.sub(r"[^\d\.\-\+]", "", cleaned)
    
    if not cleaned:
        return None
        
    # Handle trailing signs: "5.50+" -> "+5.50", "200.00-" -> "-200.00"
    if cleaned.endswith("-"):
        cleaned = "-" + cleaned[:-1]
    elif cleaned.endswith("+"):
        cleaned = "+" + cleaned[:-1]
        
    try:
        dec = Decimal(cleaned)
        if is_negative:
            dec = -dec
        return dec
    except InvalidOperation:
        logger.warning(f"Could not parse amount string: '{val}' (cleaned: '{cleaned}')")
        return None

MONTH_MAP = {
    "jan": "01", "january": "01",
    "feb": "02", "february": "02",
    "mar": "03", "march": "03",
    "apr": "04", "april": "04",
    "may": "05",
    "jun": "06", "june": "06",
    "jul": "07", "july": "07",
    "aug": "08", "august": "08",
    "sep": "09", "september": "09",
    "oct": "10", "october": "10",
    "nov": "11", "november": "11",
    "dec": "12", "december": "12"
}

def normalize_date_string(val: str) -> str:
    """
    Normalizes alphabetical month names in a date string to their 2-digit numeric representation,
    making parsing locale-independent and case-insensitive.
    """
    lower_val = val.lower()
    months_sorted = sorted(MONTH_MAP.keys(), key=len, reverse=True)
    for m in months_sorted:
        if m in lower_val:
            pattern = re.compile(rf"\b{m}\b", re.IGNORECASE)
            if pattern.search(val):
                val = pattern.sub(MONTH_MAP[m], val)
                break
    return val

def parse_date(val: Optional[str]) -> Optional[date]:
    """
    Parses a string date using config.DATE_FORMATS.
    Returns datetime.date if successful, None otherwise.
    """
    if not val:
        return None
        
    cleaned = val.strip()
    
    # Normalize month names to numeric representation
    cleaned = normalize_date_string(cleaned)
    
    for fmt in config.DATE_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
            
    logger.warning(f"Could not parse date string: '{val}' (normalized: '{cleaned}') against formats {config.DATE_FORMATS}")
    return None

def sanitize_text(val: Optional[str]) -> str:
    """
    Sanitizes text by removing extra spaces, tabs, and newlines.
    """
    if not val:
        return ""
    # Replace multiple whitespaces/newlines with a single space
    return re.sub(r"\s+", " ", val).strip()
