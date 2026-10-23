"""GET /api/report/{id} — download PDF or JSON report."""

from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.email_analysis import EmailAnalysis
from app.services.report_generator import generate_json_report, generate_pdf_report

router = APIRouter()


def _record_to_dict(r: EmailAnalysis) -> dict:
    return {
        "id": r.id,
        "subject": r.subject,
        "sender": r.sender,
        "recipient": r.recipient,
        "classification": r.classification,
        "risk_score": r.risk_score,
        "severity": r.severity,
        "detection_signals": r.detection_signals or [],
        "extracted_urls": r.extracted_urls or [],
        "attachment_info": r.attachment_info or [],
        "forensic_data": r.forensic_data or {},
        "recommended_actions": r.recommended_actions or [],
        "analysis_mode": r.analysis_mode,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/report/{analysis_id}")
async def download_report(
    analysis_id: int,
    fmt: Literal["json", "pdf"] = Query(default="json"),
    db: AsyncSession = Depends(get_db),
):
    record = await db.get(EmailAnalysis, analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    data = _record_to_dict(record)
    filename = f"phishguard_report_{analysis_id}"

    if fmt == "pdf":
        content = generate_pdf_report(data)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
        )
    else:
        content = generate_json_report(data)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )
