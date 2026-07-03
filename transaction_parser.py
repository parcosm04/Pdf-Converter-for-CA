import re
from typing import List, Dict, Any, Tuple, Optional
from datetime import date
from decimal import Decimal
from pydantic import ValidationError
from loguru import logger

from config import config
from models import Transaction, ExceptionRecord
from utils import parse_date, parse_amount, sanitize_text

def resolve_amount_and_type(row: Dict[str, str]) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    Given a row, attempts to extract and split debit and credit values.
    Supports:
      1. Explicit 'debit' and 'credit' columns.
      2. Single 'amount' column combined with a 'type' (Dr/Cr) column.
      3. Single 'amount' column with signs/indicators in the value itself.
    """
    deb_val = parse_amount(row.get("debit"))
    crd_val = parse_amount(row.get("credit"))
    
    # If explicit columns are found, return them
    if deb_val is not None or crd_val is not None:
        return deb_val, crd_val
        
    # Check for single amount column
    amt_str = row.get("amount")
    if not amt_str:
        return None, None
        
    amt_val = parse_amount(amt_str)
    if amt_val is None:
        return None, None
        
    # Check type/indicator column if present
    txn_type = row.get("type", "").strip().lower()
    raw_amt_lower = amt_str.lower()
    
    is_debit = False
    is_credit = False
    
    if txn_type:
        if any(x in txn_type for x in ["dr", "debit", "withdrawal", "payment"]):
            is_debit = True
        elif any(x in txn_type for x in ["cr", "credit", "deposit", "receipt"]):
            is_credit = True
            
    if not is_debit and not is_credit:
        # Look for indicators in amount string itself
        if "dr" in raw_amt_lower or "-" in raw_amt_lower or "(" in raw_amt_lower:
            is_debit = True
        elif "cr" in raw_amt_lower or "+" in raw_amt_lower:
            is_credit = True
        else:
            # Default to positive = credit, negative = debit
            if amt_val < 0:
                is_debit = True
            else:
                is_credit = True
                
    if is_debit:
        return abs(amt_val), None
    else:
        return None, abs(amt_val)

def parse_transactions_stream(
    pages_rows: List[Tuple[int, List[Dict[str, str]]]]
) -> Tuple[List[Transaction], List[ExceptionRecord]]:
    """
    Parses a stream of reconstructed rows from all pages into Transaction and ExceptionRecord models.
    Supports multi-line narration merging and cross-page carry forward.
    """
    transactions: List[Transaction] = []
    exceptions: List[ExceptionRecord] = []
    
    pending_txn: Optional[Dict[str, Any]] = None
    
    # Pre-compile the transaction start regex
    date_regex = re.compile(config.NEW_TRANSACTION_REGEX)
    
    for page_num, rows in pages_rows:
        logger.info(f"Parsing page {page_num} rows stream...")
        
        for row_idx, row in enumerate(rows):
            # Check if this row is a new transaction (starts with a valid date)
            raw_date_str = row.get("date", "").strip()
            
            # Clean leading serial number prefix (e.g. "1 10.04.2025" -> "10.04.2025")
            if raw_date_str:
                parts = raw_date_str.split()
                if len(parts) > 1 and parts[0].isdigit() and len(parts[0]) <= 4:
                    remainder = " ".join(parts[1:])
                    if date_regex.match(remainder):
                        raw_date_str = remainder
            
            is_new_txn = False
            if raw_date_str:
                # Does it match the transaction date regex?
                if date_regex.match(raw_date_str):
                    is_new_txn = True
            
            if is_new_txn:
                # 1. Commit any pending transaction before starting the new one
                if pending_txn:
                    commit_pending_transaction(pending_txn, transactions, exceptions)
                    pending_txn = None
                
                # 2. Start a new transaction
                parsed_date = parse_date(raw_date_str)
                if not parsed_date:
                    exceptions.append(
                        ExceptionRecord(
                            page=page_num,
                            transaction=f"Row {row_idx}: {row}",
                            issue="Invalid transaction date format",
                            expected="Valid Date",
                            found=raw_date_str
                        )
                    )
                    continue
                
                val_date_str = row.get("value_date", "").strip()
                parsed_val_date = parse_date(val_date_str) if val_date_str else parsed_date
                
                deb_val, crd_val = resolve_amount_and_type(row)
                bal_val = parse_amount(row.get("closing_balance"))
                
                pending_txn = {
                    "date": parsed_date,
                    "narration": row.get("narration", ""),
                    "reference_number": row.get("reference_number"),
                    "value_date": parsed_val_date,
                    "debit": deb_val,
                    "credit": crd_val,
                    "closing_balance": bal_val if bal_val is not None else Decimal("0"),
                    "page": page_num
                }
                
            else:
                # This is a continuation row (multi-line narration or other data)
                if pending_txn:
                    # Append narration
                    extra_narration = row.get("narration", "").strip()
                    if extra_narration:
                        pending_txn["narration"] = (pending_txn["narration"] + " " + extra_narration).strip()
                    
                    # Proactively check if other columns have values that can fill missing pieces in pending transaction
                    if not pending_txn.get("reference_number") and row.get("reference_number"):
                        pending_txn["reference_number"] = row.get("reference_number")
                        
                    if pending_txn.get("debit") is None and pending_txn.get("credit") is None:
                        deb_val, crd_val = resolve_amount_and_type(row)
                        if deb_val is not None or crd_val is not None:
                            pending_txn["debit"] = deb_val
                            pending_txn["credit"] = crd_val
                    else:
                        if pending_txn.get("debit") is None and row.get("debit"):
                            pending_txn["debit"] = parse_amount(row.get("debit"))
                            
                        if pending_txn.get("credit") is None and row.get("credit"):
                            pending_txn["credit"] = parse_amount(row.get("credit"))
                        
                    if pending_txn.get("closing_balance") == Decimal("0") and row.get("closing_balance"):
                        pending_txn["closing_balance"] = parse_amount(row.get("closing_balance"))
                else:
                    # No active transaction to append to. Check if this is noise or a header/footer text.
                    content = " | ".join(f"{k}:{v}" for k, v in row.items() if v)
                    if content:
                        logger.debug(f"Ignoring non-transaction row on page {page_num}: '{content}'")
                        
    # Commit the final pending transaction at the end of the PDF
    if pending_txn:
        commit_pending_transaction(pending_txn, transactions, exceptions)
        
    # Sanitize narration spacing for all transactions
    for t in transactions:
        t.narration = sanitize_text(t.narration)
        
    logger.info(f"Parsing complete. Extracted {len(transactions)} transactions with {len(exceptions)} exceptions.")
    return transactions, exceptions

def commit_pending_transaction(
    pending_txn: Dict[str, Any],
    transactions: List[Transaction],
    exceptions: List[ExceptionRecord]
) -> None:
    """
    Attempts to instantiate a Pydantic Transaction from the pending transaction dict
    and append it to transactions. If validation fails, logs to exceptions list.
    """
    try:
        # Create Pydantic model to trigger structural validation checks
        txn = Transaction(**pending_txn)
        transactions.append(txn)
    except ValidationError as ve:
        # Construct helpful validation error summary
        err_msgs = []
        for error in ve.errors():
            loc = " -> ".join(str(l) for l in error["loc"])
            err_msgs.append(f"{loc}: {error['msg']}")
        
        issue_str = "; ".join(err_msgs)
        logger.warning(f"Transaction validation error on page {pending_txn['page']}: {issue_str}")
        
        exceptions.append(
            ExceptionRecord(
                page=pending_txn["page"],
                transaction=f"Date: {pending_txn['date']}, Narration: {pending_txn['narration'][:50]}...",
                issue=f"Validation failed: {issue_str}",
                expected="Valid transaction schema",
                found=str(pending_txn)
            )
        )
