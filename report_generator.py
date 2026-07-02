from typing import List
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from models import ValidationSummary, ExceptionRecord
from loguru import logger

console = Console()

def generate_and_print_report(summary: ValidationSummary, exceptions: List[ExceptionRecord]) -> None:
    """
    Generates and prints a rich console report showing the results of bank statement parsing.
    """
    logger.info("Printing parse report to console...")
    
    # 1. Header and Overall Status
    status_text = summary.validation_status
    if status_text == "PASS":
        status_color = "bold green"
        status_banner = Panel(
            Text(f"SUCCESS: BANK STATEMENT PARSING COMPLETED SUCCESSFULLY\nStatus: {status_text}", justify="center", style=status_color),
            border_style="green",
            title="Validation Result",
            expand=False
        )
    else:
        status_color = "bold red"
        status_banner = Panel(
            Text(f"FAILURE: BANK STATEMENT AUDIT CHECKS FAILED\nStatus: {status_text}", justify="center", style=status_color),
            border_style="red",
            title="Validation Result",
            expand=False
        )
        
    console.print()
    console.print(status_banner)
    console.print()
    
    # 2. Detailed Summary Table
    table = Table(title="Audit Metrics Summary", show_header=True, header_style="bold blue")
    table.add_column("Metric", style="cyan", width=35)
    table.add_column("Value", style="magenta", justify="right", width=25)
    
    table.add_row("Pages Processed", str(summary.pages_processed))
    table.add_row("Transactions Extracted", str(summary.transactions_extracted))
    table.add_row("Opening Balance", f"${summary.opening_balance:,.2f}")
    table.add_row("Total Debits (-)", f"${summary.total_debit:,.2f}")
    table.add_row("Total Credits (+)", f"${summary.total_credit:,.2f}")
    table.add_row("Calculated Closing Balance", f"${summary.calculated_closing_balance:,.2f}")
    table.add_row("PDF Statement Closing Balance", f"${summary.pdf_closing_balance:,.2f}")
    
    # Balance matches check row
    match_style = "bold green" if summary.balance_match else "bold red"
    table.add_row(
        "Mathematical Balance Match",
        Text("YES" if summary.balance_match else "NO", style=match_style, justify="right")
    )
    
    # Highlight errors/issues rows
    dup_style = "bold red" if summary.duplicate_rows > 0 else "green"
    table.add_row("Duplicate Rows Detected", Text(str(summary.duplicate_rows), style=dup_style))
    
    disc_style = "bold red" if summary.missing_rows > 0 else "green"
    table.add_row("Balance Discrepancies", Text(str(summary.missing_rows), style=disc_style))
    
    broken_style = "bold red" if summary.broken_narrations > 0 else "green"
    table.add_row("Empty/Broken Narrations", Text(str(summary.broken_narrations), style=broken_style))
    
    console.print(table)
    console.print()
    
    # 3. Exceptions Table (if any exist)
    if exceptions:
        console.print(Panel(Text("EXCEPTION DETAILS", style="bold yellow"), border_style="yellow", expand=False))
        
        ex_table = Table(show_header=True, header_style="bold yellow")
        ex_table.add_column("Page", style="cyan", justify="center", width=6)
        ex_table.add_column("Issue", style="red", width=30)
        ex_table.add_column("Expected", style="green", width=25)
        ex_table.add_column("Found", style="yellow", width=25)
        
        # Show top 15 exceptions in console to prevent console clutter
        shown_exceptions = exceptions[:15]
        for ex in shown_exceptions:
            ex_table.add_row(
                str(ex.page),
                ex.issue,
                ex.expected or "-",
                ex.found or "-"
            )
            
        console.print(ex_table)
        
        if len(exceptions) > 15:
            console.print(f"[yellow]... and {len(exceptions) - 15} more exceptions. See the output Excel file for a complete log.[/yellow]")
        console.print()
