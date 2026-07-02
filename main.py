import os
import sys
import argparse
from loguru import logger

from config import config
from extractor import extract_pdf_words, ScannedPDFError
from table_detector import TableDetector
from row_reconstructor import reconstruct_rows
from transaction_parser import parse_transactions_stream
from validator import validate_transactions
from excel_writer import write_excel_workbook
from report_generator import generate_and_print_report

def setup_logging():
    """
    Configures Loguru logger format, destination, and log levels.
    """
    # Create logs directory if it does not exist
    os.makedirs(os.path.dirname(config.LOG_FILE), exist_ok=True)
    
    # Remove default handler
    logger.remove()
    
    # Console logging (INFO level, formatted)
    logger.add(
        sys.stderr,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
    
    # File logging (DEBUG level, handles rotation/retention)
    logger.add(
        config.LOG_FILE,
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="10 MB",
        retention="30 days",
        compression="zip"
    )

def run_pipeline(pdf_path: str, excel_path: str) -> bool:
    """
    Executes the bank statement parsing pipeline.
    """
    logger.info("Initializing Bank Statement Parser Pipeline...")
    
    try:
        # 1. Extract Words with Coordinates
        pages_data = extract_pdf_words(pdf_path)
        total_pages = len(pages_data)
        
        # 2 & 3. Table Detection and Row Reconstruction per page
        detector = TableDetector()
        pages_rows = []
        
        for page_num, words, (width, height) in pages_data:
            # Detect table columns and vertical boundaries
            boundaries, start_y, end_y = detector.detect_table_layout(words, width, height)
            
            # Group words into structured cell texts
            rows = reconstruct_rows(words, boundaries, start_y, end_y, config.Y_TOLERANCE)
            pages_rows.append((page_num, rows))
            
        # 4. Parse Rows into Transaction Objects
        transactions, exceptions = parse_transactions_stream(pages_rows)
        
        # 5. Math & Duplicate validation
        summary, exceptions = validate_transactions(transactions, exceptions, total_pages)
        
        # 6. Print Console Report
        generate_and_print_report(summary, exceptions)
        
        # 7. Write Structured Excel Workbook
        write_excel_workbook(excel_path, transactions, summary, exceptions)
        
        logger.info(f"Pipeline finished. Output written to {excel_path}")
        return summary.validation_status == "PASS"
        
    except ScannedPDFError as se:
        logger.error(f"Scanned PDF detected: {se}")
        print(f"\n[ERROR] Processing Aborted: {se}", file=sys.stderr)
        return False
    except Exception as e:
        logger.exception("An unexpected error occurred during pipeline execution.")
        print(f"\n[FATAL] Pipeline failed: {e}", file=sys.stderr)
        return False

def main():
    setup_logging()
    
    parser = argparse.ArgumentParser(
        description="Enterprise Grade Bank Statement Parser & Mathematical Auditor"
    )
    parser.add_argument(
        "pdf_path",
        help="Path to the digital bank statement PDF"
    )
    parser.add_argument(
        "-o", "--output",
        help="Path to save the generated Excel spreadsheet (default: same folder as input with .xlsx)"
    )
    
    args = parser.parse_args()
    
    pdf_path = args.pdf_path
    if not os.path.exists(pdf_path):
        logger.error(f"Input PDF file not found: {pdf_path}")
        print(f"Error: File not found at {pdf_path}", file=sys.stderr)
        sys.exit(1)
        
    excel_path = args.output
    if not excel_path:
        base_name, _ = os.path.splitext(pdf_path)
        excel_path = base_name + ".xlsx"
        
    success = run_pipeline(pdf_path, excel_path)
    
    # Exit with code 0 if PASS, else 1
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
