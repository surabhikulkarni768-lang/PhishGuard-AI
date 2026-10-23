"""Report generation service — PDF and JSON."""

from __future__ import annotations
import json
import os
from datetime import datetime
from pathlib import Path

from app.core.config import settings


def _ensure_report_dir() -> Path:
    p = Path(settings.report_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


def generate_json_report(record: dict) -> bytes:
    """Return JSON bytes of the analysis record."""
    return json.dumps(record, indent=2, default=str).encode("utf-8")


def generate_pdf_report(record: dict) -> bytes:
    """Generate a PDF investigation report using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from io import BytesIO

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    # Colors
    NAVY = colors.HexColor("#0f172a")
    BLUE = colors.HexColor("#3b82f6")
    RED = colors.HexColor("#ef4444")
    AMBER = colors.HexColor("#f59e0b")
    GREEN = colors.HexColor("#22c55e")
    LIGHT = colors.HexColor("#f1f5f9")

    title_style = ParagraphStyle("Title", parent=styles["Heading1"],
                                 textColor=NAVY, fontSize=20, spaceAfter=4)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
                               textColor=BLUE, fontSize=13, spaceAfter=4, spaceBefore=10)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
                                fontSize=9, leading=13)
    small_style = ParagraphStyle("Small", parent=styles["Normal"],
                                 fontSize=8, textColor=colors.grey)

    classification = record.get("classification", "unknown").upper()
    risk_score = record.get("risk_score", 0)
    cls_color = {"PHISHING": RED, "SUSPICIOUS": AMBER, "SAFE": GREEN}.get(classification, BLUE)

    story.append(Paragraph("PhishGuard AI — Forensic Investigation Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", small_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceAfter=8))

    # Verdict banner
    verdict_data = [
        [Paragraph(f"<b>Verdict: {classification}</b>", ParagraphStyle("V", fontSize=14, textColor=cls_color)),
         Paragraph(f"<b>Risk Score: {risk_score}/100</b>", ParagraphStyle("V2", fontSize=14)),
         Paragraph(f"<b>Severity: {record.get('severity','').upper()}</b>", ParagraphStyle("V3", fontSize=14))],
    ]
    vt = Table(verdict_data, colWidths=["40%", "30%", "30%"])
    vt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                             ("BOX", (0, 0), (-1, -1), 1, BLUE),
                             ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                             ("TOPPADDING", (0, 0), (-1, -1), 8),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    story.append(vt)
    story.append(Spacer(1, 0.4*cm))

    # Email metadata
    story.append(Paragraph("Email Metadata", h2_style))
    meta = [
        ["Field", "Value"],
        ["Subject", str(record.get("subject", ""))[:120]],
        ["Sender", str(record.get("sender", ""))],
        ["Recipient", str(record.get("recipient", ""))],
        ["Analysis ID", str(record.get("id", ""))],
        ["Analysis Date", str(record.get("created_at", ""))],
        ["Analysis Mode", str(record.get("analysis_mode", "rule-based"))],
    ]
    mt = Table(meta, colWidths=["25%", "75%"])
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(mt)
    story.append(Spacer(1, 0.3*cm))

    # Detection signals
    story.append(Paragraph("Detection Signals", h2_style))
    signals = record.get("detection_signals", [])
    if signals:
        sig_data = [["Category", "Description", "Weight"]]
        for s in signals:
            sig_data.append([
                str(s.get("category", "")),
                str(s.get("description", ""))[:100],
                f"{s.get('weight', 0):.0f}",
            ])
        st = Table(sig_data, colWidths=["18%", "66%", "16%"])
        st.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(st)
    else:
        story.append(Paragraph("No detection signals triggered.", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Recommendations
    story.append(Paragraph("Recommended Actions", h2_style))
    for rec in record.get("recommended_actions", []):
        story.append(Paragraph(f"• {rec}", body_style))
    story.append(Spacer(1, 0.3*cm))

    # Extracted URLs
    urls = record.get("extracted_urls", [])
    if urls:
        story.append(Paragraph("Extracted URLs", h2_style))
        url_data = [["URL", "Domain", "Suspicious"]]
        for u in urls[:20]:
            url_data.append([
                str(u.get("url", ""))[:60],
                str(u.get("domain", "")),
                "Yes" if u.get("is_suspicious") else "No",
            ])
        ut = Table(url_data, colWidths=["55%", "30%", "15%"])
        ut.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 7),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(ut)
        story.append(Spacer(1, 0.3*cm))

    # Disclaimer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
    story.append(Paragraph(
        "⚠ Disclaimer: This report was generated by an automated rule-based detection system. "
        "It may produce false positives and false negatives. Always consult a security professional "
        "for high-stakes decisions. Do not act on this report alone.",
        small_style,
    ))

    doc.build(story)
    return buf.getvalue()
