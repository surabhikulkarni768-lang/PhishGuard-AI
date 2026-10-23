"""POST /api/analyze — analyze pasted content, headers, or uploaded .eml file."""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from dataclasses import asdict

from app.db.database import get_db
from app.models.email_analysis import EmailAnalysis
from app.services.detection_engine import analyze_email
from app.core.config import settings

router = APIRouter()

MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024


def _result_to_dict(result) -> dict:
    """Convert AnalysisResult dataclass to JSON-serialisable dict."""
    d = asdict(result)
    return d


@router.post("/analyze")
async def analyze(
    raw_content: Optional[str] = Form(default=""),
    sender: Optional[str] = Form(default=""),
    subject: Optional[str] = Form(default=""),
    headers_text: Optional[str] = Form(default=""),
    file: Optional[UploadFile] = File(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Accept email content via form fields or .eml file upload and run analysis."""

    if file:
        if file.content_type not in ("message/rfc822", "application/octet-stream", "text/plain", None):
            # Accept .eml regardless of MIME type declared by browser
            pass
        data = await file.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="File exceeds upload size limit.")
        raw_content = data.decode("utf-8", errors="replace")

    if not raw_content and not headers_text and not sender:
        raise HTTPException(status_code=422, detail="Provide email content, headers, or a .eml file.")

    result = analyze_email(
        raw_content=raw_content or "",
        sender_input=sender or "",
        subject_input=subject or "",
        headers_only=headers_text or "",
    )

    rd = _result_to_dict(result)
    forensic_data = rd.pop("forensic_data", {})
    # Convert received_hops list to JSON-serialisable
    if isinstance(forensic_data.get("received_hops"), list):
        forensic_data["received_hops"] = forensic_data["received_hops"]

    record = EmailAnalysis(
        subject=result.subject[:500] if result.subject else "",
        sender=result.sender[:300] if result.sender else "",
        recipient=result.recipient[:300] if result.recipient else "",
        raw_headers=result.raw_headers[:10000] if result.raw_headers else "",
        raw_body=(raw_content or "")[:20000],
        classification=result.classification,
        risk_score=result.risk_score,
        severity=result.severity,
        detection_signals=[asdict(s) for s in result.signals],
        extracted_urls=[asdict(u) for u in result.extracted_urls],
        attachment_info=[asdict(a) for a in result.attachments],
        forensic_data=forensic_data,
        recommended_actions=result.recommended_actions,
        analysis_mode=result.analysis_mode,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return {
        "id": record.id,
        "classification": result.classification,
        "risk_score": result.risk_score,
        "severity": result.severity,
        "summary": result.summary,
        "subject": result.subject,
        "sender": result.sender,
        "recipient": result.recipient,
        "signals": [asdict(s) for s in result.signals],
        "extracted_urls": [asdict(u) for u in result.extracted_urls],
        "attachments": [asdict(a) for a in result.attachments],
        "forensic_data": forensic_data,
        "recommended_actions": result.recommended_actions,
        "analysis_mode": result.analysis_mode,
        "created_at": record.created_at.isoformat() if record.created_at else None,
    }
