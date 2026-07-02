from extractor import extract_pdf_words
from table_detector import TableDetector
from row_reconstructor import reconstruct_rows
from config import config

def debug_header():
    w = extract_pdf_words("ICICI Bank.pdf")
    page_num, words, (width, height) = w[0]
    
    detector = TableDetector()
    lines = detector.group_words_into_lines(words, y_tolerance=8.0)
    
    print("--- GROUPED LINES (Y-TOLERANCE 8.0) ---")
    for idx, line in enumerate(lines):
        phrases = detector._group_line_into_phrases(line)
        phrase_texts = [p["text"] for p in phrases]
        
        # Check matches
        matches = []
        for p in phrases:
            col_key = detector._match_column(p["text"])
            if col_key:
                matches.append((p["text"], col_key))
                
        # Only print lines in the top 40% of the page
        if line[0]["top"] < height * 0.4:
            print(f"Line {idx} (Y={line[0]['top']:.2f}):")
            print(f"  Phrases: {phrase_texts}")
            print(f"  Matches: {matches}")

if __name__ == '__main__':
    debug_header()
