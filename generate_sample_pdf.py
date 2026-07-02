import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_sample_pdf(filename: str):
    print(f"Creating sample PDF bank statement: {filename}")
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#1B365D'),
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=11
    )
    
    header_col_style = ParagraphStyle(
        'HeaderCol',
        parent=styles['BodyText'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
        alignment=1 # Centered
    )
    
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=11
    )
    
    story = []
    
    # Title
    story.append(Paragraph("APEX GLOBAL BANKING", title_style))
    story.append(Paragraph("<b>STATEMENT OF ACCOUNT</b>", ParagraphStyle('Sub', parent=title_style, fontSize=12)))
    story.append(Spacer(1, 15))
    
    # Account Details
    details_data = [
        [Paragraph("<b>Account Number:</b> 1234-5678-9012", cell_style), Paragraph("<b>Statement Period:</b> 01 Jun 2026 - 30 Jun 2026", cell_style)],
        [Paragraph("<b>Account Holder:</b> John Doe", cell_style), Paragraph("<b>Opening Balance:</b> $5,000.00", cell_style)]
    ]
    details_table = Table(details_data, colWidths=[270, 270])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    # Table headers
    headers = [
        Paragraph("Date", header_col_style),
        Paragraph("Narration", header_col_style),
        Paragraph("Reference Number", header_col_style),
        Paragraph("Value Date", header_col_style),
        Paragraph("Debit", header_col_style),
        Paragraph("Credit", header_col_style),
        Paragraph("Closing Balance", header_col_style)
    ]
    
    # Row Data
    rows = [
        headers,
        # Transaction 1: Simple credit
        [
            Paragraph("01/06/2026", cell_style),
            Paragraph("INTEREST PAY", cell_style),
            Paragraph("TXN10001", cell_style),
            Paragraph("01/06/2026", cell_style),
            Paragraph("", cell_style),
            Paragraph("150.00", cell_style),
            Paragraph("5,150.00", cell_style)
        ],
        # Transaction 2: Simple debit
        [
            Paragraph("05/06/2026", cell_style),
            Paragraph("ATM CASH WITHDRAWAL", cell_style),
            Paragraph("TXN10002", cell_style),
            Paragraph("05/06/2026", cell_style),
            Paragraph("200.00", cell_style),
            Paragraph("", cell_style),
            Paragraph("4,950.00", cell_style)
        ],
        # Transaction 3: Wrapped multi-line narration
        [
            Paragraph("10/06/2026", cell_style),
            Paragraph("TRANSFER FROM EMPLOYER", cell_style),
            Paragraph("TXN10003", cell_style),
            Paragraph("10/06/2026", cell_style),
            Paragraph("", cell_style),
            Paragraph("3,200.00", cell_style),
            Paragraph("8,150.00", cell_style)
        ],
        # Continuation rows for Transaction 3 narration
        [
            Paragraph("", cell_style),
            Paragraph("MONTHLY SALARY REF #99839", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style)
        ],
        [
            Paragraph("", cell_style),
            Paragraph("ADDITIONAL BONUS FOR Q1", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("", cell_style)
        ],
        # Transaction 4: Simple debit
        [
            Paragraph("15/06/2026", cell_style),
            Paragraph("ONLINE SHOPPING DEBIT", cell_style),
            Paragraph("TXN10004", cell_style),
            Paragraph("15/06/2026", cell_style),
            Paragraph("120.00", cell_style),
            Paragraph("", cell_style),
            Paragraph("8,030.00", cell_style)
        ],
        # Transaction 5: Duplicate transaction to test duplicate filter
        # It has the exact same fields as Row 1
        [
            Paragraph("01/06/2026", cell_style),
            Paragraph("INTEREST PAY", cell_style),
            Paragraph("TXN10001", cell_style),
            Paragraph("01/06/2026", cell_style),
            Paragraph("", cell_style),
            Paragraph("150.00", cell_style),
            Paragraph("5,150.00", cell_style)
        ],
        # Transaction 6: Debit causing a balance mismatch (balance should be 7,944.50, but we print 7,900.00)
        [
            Paragraph("20/06/2026", cell_style),
            Paragraph("UTILITY BILL AUTOPAY", cell_style),
            Paragraph("TXN10005", cell_style),
            Paragraph("20/06/2026", cell_style),
            Paragraph("85.50", cell_style),
            Paragraph("", cell_style),
            Paragraph("7,900.00", cell_style) # Incorrect balance to trigger ExceptionRecord
        ]
    ]
    
    # Table Styling
    # Widths: Date, Narration, Ref, Val Date, Debit, Credit, Balance
    col_widths = [65, 175, 75, 65, 50, 50, 60]
    
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B365D')),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D3D3D3')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F2F5F8')]),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('TOPPADDING', (0,1), (-1,-1), 4),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>End of Statement</b>", cell_style))
    
    doc.build(story)
    print("Sample PDF generated successfully.")

if __name__ == '__main__':
    create_sample_pdf("sample_statement.pdf")
