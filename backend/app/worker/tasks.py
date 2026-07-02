import sys
import os
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from loguru import logger

# Add parser path to sys.path so flat imports (from config import config) resolve correctly
current_dir = os.path.dirname(os.path.abspath(__file__))
parser_dir = os.path.abspath(os.path.join(current_dir, "..", "services", "parser"))
if parser_dir not in sys.path:
    sys.path.insert(0, parser_dir)

# Now we can import the flat parser modules
from extractor import extract_pdf_words
from table_detector import TableDetector
from row_reconstructor import reconstruct_rows
from transaction_parser import parse_transactions_stream
from validator import validate_transactions
from excel_writer import write_excel_workbook

from app.worker.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.models import Job, Transaction as DBTransaction, ExceptionRecord as DBExceptionRecord

@celery_app.task(name="app.worker.tasks.process_bank_statement")
def process_bank_statement(job_id_str: str, file_path: str):
    """
    Asynchronous Celery task to parse a bank statement PDF and audit transactions.
    Saves extracted records to PostgreSQL and generates a styled Excel file.
    """
    logger.info(f"Starting async processing for Job {job_id_str} | File: {file_path}")
    job_id = uuid.UUID(job_id_str)
    
    db = SessionLocal()
    try:
        # 1. Update job status to processing
        db_job = db.query(Job).filter(Job.id == job_id).first()
        if not db_job:
            logger.error(f"Job {job_id_str} not found in database.")
            return False
            
        db_job.file_status = "processing"
        db.commit()
        
        # 2. Run parser pipeline
        # Extract raw words from PDF
        pages_data = extract_pdf_words(file_path)
        
        # Detect layouts and group rows per page
        p_rows = []
        detector = TableDetector()
        for page_num, words, (width, height) in pages_data:
            boundaries, start_y, end_y = detector.detect_table_layout(words, width, height)
            rows = reconstruct_rows(words, boundaries, start_y, end_y)
            p_rows.append((page_num, rows))
            
        # Parse transaction stream (merging multi-line narrations)
        txns, exc = parse_transactions_stream(p_rows)
        
        # Run mathematical verification (audit checks)
        summary, exceptions = validate_transactions(txns, exc, len(pages_data))
        
        # 3. Write Excel workbook to outputs folder
        output_xlsx_path = os.path.join(settings.EXCEL_OUTPUT_DIR, f"{job_id_str}.xlsx")
        write_excel_workbook(output_xlsx_path, txns, summary, exceptions)
        
        # 4. Save extracted transactions to database
        for txn in txns:
            db_txn = DBTransaction(
                job_id=job_id,
                transaction_date=txn.date,
                narration=txn.narration,
                reference_number=txn.reference_number,
                debit=txn.debit,
                credit=txn.credit,
                closing_balance=txn.closing_balance,
                page_number=txn.page
            )
            db.add(db_txn)
            
        # Save validation exceptions to database
        for ex in exceptions:
            db_exc = DBExceptionRecord(
                job_id=job_id,
                page_number=ex.page,
                row_content=ex.transaction,
                issue_details=ex.issue,
                expected_format=ex.expected,
                found_value=ex.found
            )
            db.add(db_exc)
            
        # 5. Update job metrics and mark completed
        db_job.opening_balance = summary.opening_balance
        db_job.closing_balance = summary.pdf_closing_balance
        db_job.audit_passed = (summary.validation_status == "PASS")
        db_job.txn_count = len(txns)
        db_job.file_status = "completed"
        db_job.download_url_xlsx = f"/api/v1/jobs/{job_id_str}/download"
        db.commit()
        
        logger.info(f"Successfully processed Job {job_id_str} | Transactions: {len(txns)} | Status: {summary.validation_status}")
        return True
        
    except Exception as e:
        logger.exception(f"Failed to process Job {job_id_str}")
        db.rollback()
        
        # Update job to failed status with error details
        db_job = db.query(Job).filter(Job.id == job_id).first()
        if db_job:
            db_job.file_status = "failed"
            db_job.error_message = str(e)
            db.commit()
            
        return False
    finally:
        db.close()

@celery_app.task(name="app.worker.tasks.auto_prune_files")
def auto_prune_files():
    """
    Scheduled Celery task to delete files older than UPLOAD_RETENTION_HOURS (24 hours).
    Cleans up temp PDFs and generated Excel workbooks.
    """
    logger.info("Running scheduled cleanup task...")
    retention_limit = datetime.utcnow() - timedelta(hours=settings.FILE_RETENTION_HOURS)
    
    prune_count = 0
    for directory in [settings.UPLOAD_DIR, settings.EXCEL_OUTPUT_DIR]:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            # Skip hidden files
            if filename.startswith("."):
                continue
                
            try:
                mtime = datetime.utcfromtimestamp(os.path.getmtime(file_path))
                if mtime < retention_limit:
                    os.remove(file_path)
                    logger.info(f"Pruned expired file: {file_path} (mtime: {mtime})")
                    prune_count += 1
            except Exception as e:
                logger.error(f"Failed to delete file {file_path}: {str(e)}")
                
    logger.info(f"Cleanup finished. Total files pruned: {prune_count}")
    return prune_count
