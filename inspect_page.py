from extractor import extract_pdf_words
from table_detector import TableDetector
from row_reconstructor import reconstruct_rows
from transaction_parser import parse_transactions_stream
from validator import validate_transactions

def inspect():
    w = extract_pdf_words("HDFC Bank.pdf")
    p_rows = []
    detector = TableDetector()
    for page_num, words, (width, height) in w:
        b, sy, ey = detector.detect_table_layout(words, width, height)
        rows = reconstruct_rows(words, b, sy, ey)
        p_rows.append((page_num, rows))
        
    txns, exc = parse_transactions_stream(p_rows)
    summary, exceptions = validate_transactions(txns, exc, len(w))
    
    print("\n--- TRANSACTIONS ON PAGE 2 ---")
    for t in txns:
        if t.page == 2:
            print(f"Date: {t.date} | Bal: {t.closing_balance} | Dr: {t.debit} | Cr: {t.credit} | Nar: {t.narration[:60]}")
            
    print("\n--- EXCEPTIONS CONTEXT ---")
    for ex in exceptions:
        if ex.page in [2, 3]:
            print(f"Page {ex.page} | Issue: {ex.issue} | Expected: {ex.expected} | Found: {ex.found}")

if __name__ == '__main__':
    inspect()
