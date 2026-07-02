import pytest
from unittest.mock import patch, MagicMock
from extractor import extract_pdf_words, ScannedPDFError, PDFExtractionError

def test_extract_pdf_words_digital():
    with patch("pdfplumber.open") as mock_open:
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_page.width = 600
        mock_page.height = 800
        mock_page.extract_words.return_value = [
            {"text": "Date", "x0": 10, "x1": 30, "top": 50, "bottom": 62},
            {"text": "Balance", "x0": 500, "x1": 540, "top": 50, "bottom": 62}
        ]
        mock_pdf.pages = [mock_page]
        mock_open.return_value.__enter__.return_value = mock_pdf
        
        result = extract_pdf_words("mock_digital.pdf")
        assert len(result) == 1
        page_num, words, dims = result[0]
        assert page_num == 1
        assert len(words) == 2
        assert words[0]["text"] == "Date"
        assert dims == (600.0, 800.0)

def test_extract_pdf_words_scanned():
    with patch("pdfplumber.open") as mock_open:
        mock_pdf = MagicMock()
        mock_page = MagicMock()
        mock_page.width = 600
        mock_page.height = 800
        mock_page.extract_words.return_value = []  # No words extracted -> scanned
        mock_pdf.pages = [mock_page]
        mock_open.return_value.__enter__.return_value = mock_pdf
        
        with pytest.raises(ScannedPDFError):
            extract_pdf_words("mock_scanned.pdf")
