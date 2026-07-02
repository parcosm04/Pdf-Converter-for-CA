# Enterprise Bank Statement Parser & Auditor

A production-grade Python library and CLI tool capable of converting digital bank statement PDFs into fully verified Excel workbooks with audit-level accuracy.

The parser prioritizes **mathematical correctness** over speed, ensuring zero omitted, duplicated, or fabricated transactions. Every sheet is verified against mathematical running balance checks and schema constraints before output.

## Key Features
*   **Adaptive Table Detection**: Dynamically locates column coordinates (X-ranges) and page boundary limits (Y-ranges) by identifying header word alignments, rather than hardcoding coordinates.
*   **Narrative Reconstruction**: Automatically identifies, aggregates, and joins multi-line transaction narrations across wrapped rows and page boundaries.
*   **Strict Auditor Engine**: Performs running balance verification ($Balance_{i} = Balance_{i-1} - Debit_i + Credit_i$) and opening/closing balance verification.
*   **Fuzzy Duplicate Detector**: Uses transaction hashing to catch duplicate entries.
*   **Enterprise-Grade Formatting**: Generates Excel files with dark navy professional headers, auto-filters, frozen rows, zebra-striping, custom currency formatting, a detailed Validation dashboard, and a dedicated Exceptions list sheet.
*   **Zero-Guess Exception Strategy**: Strict parsing failures (schema issues, date format issues, running balance mismatches) are logged to the console, warning file, and written to the sheet to ensure complete auditable transparency.

---

## Technical Stack
*   **Language**: Python 3.12+
*   **Core Libraries**: `pdfplumber` (for word-bounding coordinate extraction), `pandas`, `openpyxl` (for Excel generation), `rapidfuzz` (fuzzy header matching), `pydantic` (schema validations), `rich` (console tables), and `loguru` (logging).

---

## Directory Structure

```
├── config.py             # Global settings, regexes, column tags, colors
├── models.py             # Pydantic models for Transaction, ExceptionRecord, ValidationSummary
├── utils.py              # Parsing helpers for dates and decimal monetary values
├── extractor.py          # PDF text coordinate reader
├── table_detector.py     # Locates table rows, column bounds, and page margins
├── row_reconstructor.py  # Groups raw words to lines and maps to columns
├── transaction_parser.py # Aggregates narrative fragments into structural transactions
├── validator.py          # Performs duplicate checks and running balance checks
├── excel_writer.py       # Writes styled worksheets using openpyxl
├── report_generator.py   # Renders the console rich tables
├── main.py               # CLI Orchestration
├── requirements.txt      # Dependencies list
└── tests/                # Comprehensive unit tests
    ├── test_extractor.py
    ├── test_row_reconstructor.py
    ├── test_parser.py
    ├── test_validator.py
    └── test_excel.py
```

---

## Getting Started

### 1. Installation

Install all required packages from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 2. Execution

Run the parser by supplying the path to a digital PDF statement:
```bash
python main.py statement.pdf
```
By default, this generates `statement.xlsx` in the same directory. To specify a custom output destination, use the `-o` or `--output` option:
```bash
python main.py statement.pdf -o d:/output/bank_report.xlsx
```

### 3. Running Unit Tests

Run the test suite via pytest:
```bash
python -m pytest -v
```

---

## Excel Output Layout

The generated workbook contains three sheets:
1.  **Transactions**: The main tabular ledger with columns for `Date`, `Narration`, `Reference Number`, `Value Date`, `Debit`, `Credit`, `Closing Balance`, and `Page`. Headers are frozen, filters are enabled, and currency fields are pre-formatted.
2.  **Validation Report**: A summary dashboard comparing calculated values vs. statement figures, presenting total debits/credits, transaction counts, duplicate counts, and validation checks.
3.  **Exceptions**: Lists details for any row that failed structural check or balance verify, specifying the exact issue, expected value, and found value.
