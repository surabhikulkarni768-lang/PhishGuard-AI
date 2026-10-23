"""GET /api/forensics/{id} — detailed forensic investigation data."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.email_analysis import EmailAnalysis

router = APIRouter()


@router.get("/forensics/{analysis_id}")
async def get_forensics(analysis_id: int, db: AsyncSession = Depends(get_db)):
    record = await db.get(EmailAnalysis, analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    forensic = record.forensic_data or {}

    # Build evidence timeline from signals
    signals = record.detection_signals or []
    timeline = []
    for i, sig in enumerate(signals, 1):
        timeline.append({
            "step": i,
            "category": sig.get("category", ""),
            "finding": sig.get("description", ""),
            "evidence": sig.get("evidence", ""),
            "weight": sig.get("weight", 0),
        })

    return {
        "id": record.id,
        "subject": record.subject,
        "sender": record.sender,
        "recipient": record.recipient,
        "classification": record.classification,
        "risk_score": record.risk_score,
        "severity": record.severity,
        "analysis_mode": record.analysis_mode,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "raw_headers": record.raw_headers,
        "forensic_data": forensic,
        "detection_signals": signals,
        "extracted_urls": record.extracted_urls or [],
        "attachments": record.attachment_info or [],
        "recommended_actions": record.recommended_actions or [],
        "evidence_timeline": timeline,
    }
