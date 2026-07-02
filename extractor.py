import pdfplumber
from typing import List, Dict, Any, Tuple
from loguru import logger

class PDFExtractionError(Exception):
    pass

class ScannedPDFError(PDFExtractionError):
    pass

def extract_pdf_words(pdf_path: str) -> List[Tuple[int, List[Dict[str, Any]], Tuple[float, float]]]:
    """
    Extracts all words with their coordinates from a PDF file.
    Returns a list of tuples: (page_num, list_of_words, (page_width, page_height))
    where page_num is 1-indexed.
    Each word is a dictionary:
      {
        'text': str,
        'x0': float,
        'top': float,
        'x1': float,
        'bottom': float
      }
    """
    results = []
    logger.info(f"Opening PDF: {pdf_path}")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            logger.info(f"Total pages in PDF: {total_pages}")
            
            total_text_words = 0
            for i, page in enumerate(pdf.pages):
                page_num = i + 1
                width = float(page.width)
                height = float(page.height)
                
                # Extract words with layout info
                words = page.extract_words(
                    x_tolerance=3,
                    y_tolerance=3,
                    keep_blank_chars=False
                )
                
                # Format to a simpler dict
                formatted_words = [
                    {
                        "text": w["text"],
                        "x0": float(w["x0"]),
                        "top": float(w["top"]),
                        "x1": float(w["x1"]),
                        "bottom": float(w["bottom"])
                    }
                    for w in words
                ]
                
                total_text_words += len(formatted_words)
                results.append((page_num, formatted_words, (width, height)))
                
            # Adhere to "never guess": If the entire PDF has no text words, it's likely scanned
            if total_text_words == 0:
                raise ScannedPDFError(
                    "The PDF contains no digital text. It is likely a scanned document which requires OCR. "
                    "Only digital PDFs are currently supported."
                )
                
            logger.info(f"Successfully extracted {total_text_words} words from {total_pages} pages.")
            return results
            
    except ScannedPDFError:
        raise
    except Exception as e:
        logger.exception(f"Failed to extract text from PDF: {pdf_path}")
        raise PDFExtractionError(f"Error reading PDF: {e}")
