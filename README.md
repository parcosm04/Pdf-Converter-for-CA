
<div align="center">

# 📄 Enterprise Bank Statement Parser & Auditor

### PDF → Verified Excel · Transaction Reconstruction · Audit Validation

A Python-based document processing system that converts digital bank statement PDFs into structured, professionally formatted Excel workbooks with built-in **transaction validation, duplicate detection, balance verification, and exception reporting**.

<br>

<a href="https://github.com/parcosm04/Pdf-Converter-for-CA">
<img src="https://img.shields.io/badge/GITHUB-111827?style=for-the-badge&logo=github&logoColor=white"/>
</a>

<img src="https://img.shields.io/badge/PYTHON-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/PDF%20PARSING-FF4D6D?style=for-the-badge"/>
<img src="https://img.shields.io/badge/EXCEL-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white"/>
<img src="https://img.shields.io/badge/AUDIT%20VALIDATION-7C3AED?style=for-the-badge"/>

</div>

---

## ⚡ Project Overview

This is an **audit-oriented bank statement processing system**, not simply a PDF-to-Excel converter.

The pipeline extracts transaction data from digital bank statement PDFs, reconstructs fragmented rows and narrations, validates the resulting ledger mathematically, detects potential duplicates, and generates a structured Excel report.

```text
       BANK STATEMENT PDF
               │
               ▼
      ┌─────────────────┐
      │ PDF Extraction  │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Table Detection │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Row Reconstruction│
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Transaction     │
      │ Parsing         │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Validation      │
      │ Engine          │
      └────────┬────────┘
               ▼
      ┌─────────────────┐
      │ Excel Generator │
      └─────────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
 Transactions Validation Exceptions
````

---

# 🔍 Core Engineering

## 1. Adaptive Table Detection

Bank statements do not always use fixed table coordinates.

Instead of relying entirely on hardcoded positions, the parser identifies **header word alignment and PDF coordinates** to determine:

* Transaction column boundaries
* Table start/end positions
* Page boundaries
* Relevant row regions

This makes the extraction process more adaptable to different statement layouts.

---

## 2. Transaction Reconstruction

PDF extraction can split a single transaction across multiple visual rows.

The reconstruction layer:

```text
Raw PDF Words
      ↓
Coordinate Grouping
      ↓
Line Reconstruction
      ↓
Column Mapping
      ↓
Narration Aggregation
      ↓
Structured Transaction
```

Multi-line narrations are automatically joined and associated with their corresponding transaction.

This also handles transaction fragments crossing page boundaries.

---

## 3. 🧮 Auditor Validation Engine

The core of the system is the mathematical validation layer.

For each transaction:

```text
Closing Balance
=
Previous Balance
- Debit
+ Credit
```

The validator checks:

* Running balances
* Opening balance
* Closing balance
* Debit totals
* Credit totals
* Transaction counts
* Duplicate transactions
* Structural/schema consistency

A mismatch is treated as an **exception**, rather than silently modifying the data.

---

## 4. 🔎 Duplicate Detection

Potential duplicate transactions are detected using transaction-level hashing and fuzzy matching techniques.

The system is designed to identify situations where the same transaction may appear multiple times due to:

* PDF extraction duplication
* Repeated rows
* Page-boundary issues
* Similar transaction records

---

## 5. 🚨 Zero-Guess Exception Strategy

The parser does not silently invent or modify questionable data.

When a transaction fails validation, the system records the issue and preserves the audit trail.

```text
Parsing Failure
      │
      ├── Console Warning
      ├── Warning / Log Output
      └── Excel Exceptions Sheet
```

Each exception can contain information such as:

`Issue` · `Expected Value` · `Found Value` · `Affected Transaction`

This makes failures visible instead of hiding them.

---

# 📊 Excel Output

The generated workbook is organized into three primary sheets.

<div align="center">

| Sheet                    | Purpose                             |
| :----------------------- | :---------------------------------- |
| 📑 **Transactions**      | Structured transaction ledger       |
| 📊 **Validation Report** | Balance and consistency checks      |
| 🚨 **Exceptions**        | Failed validation / parsing records |

</div>

### Transactions

Contains structured fields such as:

`Date` · `Narration` · `Reference Number` · `Value Date` · `Debit` · `Credit` · `Closing Balance` · `Page`

The workbook also includes:

* Frozen headers
* Auto-filters
* Currency formatting
* Professional table styling
* Zebra striping

---

# 🧰 Technology Stack

<div align="center">

### Core

<img src="https://img.shields.io/badge/PYTHON_3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/PDFPLUMBER-FF4D6D?style=for-the-badge"/>
<img src="https://img.shields.io/badge/PANDAS-150458?style=for-the-badge&logo=pandas&logoColor=white"/>

<br><br>

### Validation & Data

<img src="https://img.shields.io/badge/PYDANTIC-E92063?style=for-the-badge"/>
<img src="https://img.shields.io/badge/RAPIDFUZZ-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/DECIMAL%20VALIDATION-00E5FF?style=for-the-badge"/>

<br><br>

### Output & CLI

<img src="https://img.shields.io/badge/OPENPYXL-217346?style=for-the-badge"/>
<img src="https://img.shields.io/badge/RICH-111827?style=for-the-badge"/>
<img src="https://img.shields.io/badge/LOGURU-FFB000?style=for-the-badge"/>

</div>

---

# 📂 Architecture

```text
Pdf-Converter-for-CA/
│
├── config.py
├── models.py
├── utils.py
│
├── extractor.py
├── table_detector.py
├── row_reconstructor.py
├── transaction_parser.py
│
├── validator.py
├── excel_writer.py
├── report_generator.py
│
├── main.py
├── requirements.txt
│
└── tests/
    ├── test_extractor.py
    ├── test_row_reconstructor.py
    ├── test_parser.py
    ├── test_validator.py
    └── test_excel.py
```

---

# 🧪 Testing

The project includes dedicated tests for the major processing stages.

```bash
python -m pytest -v
```

Test coverage includes:

`PDF Extraction` · `Row Reconstruction` · `Transaction Parsing` · `Validation` · `Excel Generation`

---

# 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/parcosm04/Pdf-Converter-for-CA.git
cd Pdf-Converter-for-CA
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Convert a Statement

```bash
python main.py statement.pdf
```

The generated workbook will be created as:

```text
statement.xlsx
```

### 4. Specify Output Path

```bash
python main.py statement.pdf -o output/bank_report.xlsx
```

---

# 🔬 Engineering Focus

<div align="center">

`PDF Coordinate Parsing` · `Table Detection` · `Data Reconstruction`

`Financial Validation` · `Duplicate Detection` · `Schema Validation`

`Excel Automation` · `Exception Handling` · `CLI Architecture`

</div>

---

# 💡 Design Philosophy

The central design principle is:

> **Never silently guess when the data can be validated.**

The system separates the processing pipeline into independent stages:

```text
EXTRACT
   ↓
RECONSTRUCT
   ↓
PARSE
   ↓
VALIDATE
   ↓
REPORT
```

This architecture makes the system easier to test, debug, extend, and audit.

---

<div align="center">

### 📄 EXTRACT. VALIDATE. REPORT.

`Python` · `Document Processing` · `Financial Data` · `Automation`

<br>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00E5FF,50:7C3AED,100:FF4D6D&height=100&section=footer"/>

</div>
