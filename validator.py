from typing import List, Tuple, Set
from decimal import Decimal
from models import Transaction, ExceptionRecord, ValidationSummary
from loguru import logger

def validate_transactions(
    transactions: List[Transaction],
    extracted_exceptions: List[ExceptionRecord],
    total_pages: int
) -> Tuple[ValidationSummary, List[ExceptionRecord]]:
    """
    Validates a list of Transactions.
    Performs:
      - Running balance verification: prev_balance - debit + credit = current_balance
      - Duplicate detection based on transaction hash
      - Opening and closing balance checks
      - General schema verification
    Returns the ValidationSummary and an updated list of ExceptionRecords.
    """
    exceptions = list(extracted_exceptions)
    
    if not transactions:
        logger.warning("No transactions to validate.")
        summary = ValidationSummary(
            pages_processed=total_pages,
            transactions_extracted=0,
            opening_balance=Decimal("0.00"),
            calculated_closing_balance=Decimal("0.00"),
            pdf_closing_balance=Decimal("0.00"),
            balance_match=False,
            total_debit=Decimal("0.00"),
            total_credit=Decimal("0.00"),
            duplicate_rows=0,
            missing_rows=0,
            broken_narrations=0,
            validation_status="FAIL"
        )
        return summary, exceptions

    # 1. Opening Balance Calculation
    # The opening balance is mathematically derived from the first transaction:
    # opening_balance - first_debit + first_credit = first_closing_balance
    # => opening_balance = first_closing_balance + first_debit - first_credit
    first_txn = transactions[0]
    first_debit = first_txn.debit or Decimal("0.00")
    first_credit = first_txn.credit or Decimal("0.00")
    opening_balance = first_txn.closing_balance + first_debit - first_credit
    
    # 2. Running Balance Verification & Totals Calculation
    running_balance = opening_balance
    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")
    
    balance_mismatches = 0
    broken_narrations_count = 0
    
    for idx, txn in enumerate(transactions):
        deb = txn.debit or Decimal("0.00")
        crd = txn.credit or Decimal("0.00")
        
        total_debit += deb
        total_credit += crd
        
        # Calculate expected current balance
        expected_balance = running_balance - deb + crd
        
        if expected_balance != txn.closing_balance:
            balance_mismatches += 1
            issue_msg = f"Running balance mismatch. Expected: {expected_balance}, Found: {txn.closing_balance}"
            logger.error(f"Page {txn.page} | Txn {idx}: {issue_msg}")
            
            exceptions.append(
                ExceptionRecord(
                    page=txn.page,
                    transaction=f"Date: {txn.date}, Narration: {txn.narration[:30]}...",
                    issue="Running balance verification failed",
                    expected=str(expected_balance),
                    found=str(txn.closing_balance)
                )
            )
        
        # Update running balance to the PDF's closing balance (to continue check)
        running_balance = txn.closing_balance
        
        # Basic check for empty or broken narrations
        if not txn.narration.strip():
            broken_narrations_count += 1
            exceptions.append(
                ExceptionRecord(
                    page=txn.page,
                    transaction=f"Date: {txn.date}, Ref: {txn.reference_number}",
                    issue="Narration is empty",
                    expected="Non-empty text narration",
                    found=""
                )
            )
            
    # 3. Duplicate Detection
    seen_hashes: Set[str] = set()
    duplicate_count = 0
    
    for idx, txn in enumerate(transactions):
        t_hash = txn.get_hash()
        if t_hash in seen_hashes:
            duplicate_count += 1
            logger.warning(f"Duplicate transaction found on Page {txn.page}: {txn.date} | {txn.reference_number} | Balance: {txn.closing_balance}")
            exceptions.append(
                ExceptionRecord(
                    page=txn.page,
                    transaction=f"Date: {txn.date}, Narration: {txn.narration[:30]}...",
                    issue="Duplicate transaction detected",
                    expected="Unique Transaction",
                    found=f"Duplicate of previous record (Hash: {t_hash[:8]})"
                )
            )
        else:
            seen_hashes.add(t_hash)
            
    # PDF closing balance is the last transaction's closing balance
    pdf_closing_balance = transactions[-1].closing_balance
    calculated_closing_balance = opening_balance - total_debit + total_credit
    
    balance_match = (calculated_closing_balance == pdf_closing_balance) and (balance_mismatches == 0)
    
    # Validation status logic
    # PASS if there are no balance mismatches and validation errors
    # FAIL if there are any critical errors (balance mismatches or schema issues)
    critical_errors = balance_mismatches + len([e for e in exceptions if "Validation failed" in e.issue])
    validation_status = "PASS" if critical_errors == 0 else "FAIL"
    
    summary = ValidationSummary(
        pages_processed=total_pages,
        transactions_extracted=len(transactions),
        opening_balance=opening_balance,
        calculated_closing_balance=calculated_closing_balance,
        pdf_closing_balance=pdf_closing_balance,
        balance_match=balance_match,
        total_debit=total_debit,
        total_credit=total_credit,
        duplicate_rows=duplicate_count,
        missing_rows=balance_mismatches,  # Balance mismatch often points to missing row
        broken_narrations=broken_narrations_count,
        validation_status=validation_status
    )
    
    logger.info(f"Validation finished. Status: {validation_status}. Balance matches: {balance_match}.")
    return summary, exceptions
