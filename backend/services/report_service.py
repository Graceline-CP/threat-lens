from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
import io

def get_risk_color(classification: str):
    if classification == "High Risk":
        return colors.HexColor("#DC2626")
    elif classification == "Suspicious":
        return colors.HexColor("#D97706")
    return colors.HexColor("#059669")

def get_risk_bg(classification: str):
    if classification == "High Risk":
        return colors.HexColor("#FEE2E2")
    elif classification == "Suspicious":
        return colors.HexColor("#FEF3C7")
    return colors.HexColor("#D1FAE5")

def generate_report(data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    story = []

    # Header
    header_data = [[
        Paragraph(
            "<b>THREAT LENS</b>",
            ParagraphStyle('hdr', fontSize=26, textColor=colors.HexColor("#0F172A"),
                           fontName="Helvetica-Bold")
        ),
        Paragraph(
            f"Generated: {datetime.now().strftime('%B %d, %Y')}<br/>"
            f"<font color='#94A3B8'>{datetime.now().strftime('%H:%M UTC')}</font>",
            ParagraphStyle('hdr_r', fontSize=9, textColor=colors.HexColor("#475569"),
                           alignment=TA_RIGHT)
        ),
    ]]
    header_table = Table(header_data, colWidths=[4.5*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Cybersecurity Threat Analysis Report",
        ParagraphStyle('sub', fontSize=11, textColor=colors.HexColor("#64748B"),
                       spaceAfter=0)
    ))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0F172A")))
    story.append(Spacer(1, 16))

    # Metadata
    input_val = str(data.get("input", "N/A"))
    if len(input_val) > 90:
        input_val = input_val[:90] + "..."

    meta_rows = [
        ["Analysis Type", data.get("analysis_type", "").upper()],
        ["Input",         input_val],
        ["Generated",     datetime.now().strftime("%B %d, %Y at %H:%M UTC")],
    ]
    meta_table = Table(meta_rows, colWidths=[1.4*inch, 5.6*inch])
    meta_table.setStyle(TableStyle([
        ('FONTNAME',      (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME',      (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE',      (0, 0), (-1, -1), 10),
        ('TEXTCOLOR',     (0, 0), (0, -1), colors.HexColor("#475569")),
        ('TEXTCOLOR',     (1, 0), (1, -1), colors.HexColor("#1E293B")),
        ('ROWBACKGROUNDS',(0, 0), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
        ('GRID',          (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING',    (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Risk Score Banner - three clear columns
    classification = data.get("classification", "Unknown")
    risk_score     = data.get("risk_score", 0)
    risk_color     = get_risk_color(classification)

    score_rows = [[
        Paragraph(
            "RISK SCORE",
            ParagraphStyle('rl', fontSize=9, textColor=colors.white,
                           fontName="Helvetica-Bold", leading=14)
        ),
        Paragraph(
            f"<b>{risk_score} / 100</b>",
            ParagraphStyle('rn', fontSize=28, textColor=colors.white,
                           fontName="Helvetica-Bold", alignment=TA_CENTER, leading=34)
        ),
        Paragraph(
            f"<b>{classification.upper()}</b>",
            ParagraphStyle('rc', fontSize=15, textColor=colors.white,
                           fontName="Helvetica-Bold", alignment=TA_CENTER)
        ),
    ]]
    score_table = Table(score_rows, colWidths=[1.5*inch, 2.5*inch, 3*inch])
    score_table.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), risk_color),
        ('TOPPADDING',    (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING',   (0, 0), (-1, -1), 16),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 16),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEAFTER',     (0, 0), (0, 0), 1, colors.HexColor("#FFFFFF55")),
        ('LINEAFTER',     (1, 0), (1, 0), 1, colors.HexColor("#FFFFFF55")),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 24))

    # Detected Issues
    detected_issues = data.get("detected_issues", [])
    if detected_issues:
        story.append(Paragraph(
            "Detected Issues",
            ParagraphStyle('h2', fontSize=13, textColor=colors.HexColor("#0F172A"),
                           fontName="Helvetica-Bold", spaceAfter=10)
        ))
        issue_rows = [[
            Paragraph(
                f"  {issue}",
                ParagraphStyle('iss', fontSize=10, textColor=colors.HexColor("#374151"), leading=15)
            )
        ] for issue in detected_issues]

        issue_table = Table(issue_rows, colWidths=[7*inch])
        issue_table.setStyle(TableStyle([
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.HexColor("#F8FAFC"), colors.white]),
            ('TOPPADDING',    (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING',   (0, 0), (-1, -1), 12),
            ('GRID',          (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ]))
        story.append(issue_table)
        story.append(Spacer(1, 20))

    # Red Flags
    red_flags = data.get("red_flags", [])
    if red_flags:
        story.append(Paragraph(
            "Red Flags",
            ParagraphStyle('h2rf', fontSize=13, textColor=colors.HexColor("#DC2626"),
                           fontName="Helvetica-Bold", spaceAfter=10)
        ))
        for flag in red_flags:
            flag_rows = [
                [Paragraph(
                    f"<b>{flag.get('flag', '')}</b>",
                    ParagraphStyle('fh', fontSize=11, textColor=colors.HexColor("#DC2626"),
                                   fontName="Helvetica-Bold", leading=16)
                )],
                [Paragraph(
                    flag.get('explanation', ''),
                    ParagraphStyle('fb', fontSize=10, textColor=colors.HexColor("#374151"), leading=15)
                )],
            ]
            flag_table = Table(flag_rows, colWidths=[6.8*inch])
            flag_table.setStyle(TableStyle([
                ('BACKGROUND',    (0, 0), (-1, -1), colors.HexColor("#FEF2F2")),
                ('LEFTPADDING',   (0, 0), (-1, -1), 14),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 14),
                ('TOPPADDING',    (0, 0), (0, 0),   10),
                ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
                ('TOPPADDING',    (0, 1), (-1, -1),  4),
                ('LINEBEFORE',    (0, 0), (0, -1), 4, colors.HexColor("#DC2626")),
            ]))
            story.append(KeepTogether([flag_table, Spacer(1, 8)]))
        story.append(Spacer(1, 8))

    # Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "This report is generated automatically by Threat Lens AI. Results are indicative "
        "and should be used alongside other security measures. "
        "Not a substitute for professional cybersecurity advice.",
        ParagraphStyle('disc', fontSize=8, textColor=colors.HexColor("#94A3B8"),
                       alignment=TA_CENTER, leading=12)
    ))

    doc.build(story)
    return buffer.getvalue()