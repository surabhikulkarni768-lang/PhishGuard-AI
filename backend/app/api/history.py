"""GET /api/history — paginated analysis history."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.db.database import get_db
from app.models.email_analysis import EmailAnalysis

router = APIRouter()


def _row_to_summary(r: EmailAnalysis) -> dict:
    return {
        "id": r.id,
        "subject": r.subject,
        "sender": r.sender,
        "classification": r.classification,
        "risk_score": r.risk_score,
        "severity": r.severity,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _row_to_full(r: EmailAnalysis) -> dict:
    return {
        "id": r.id,
        "subject": r.subject,
        "sender": r.sender,
        "recipient": r.recipient,
        "raw_headers": r.raw_headers,
        "classification": r.classification,
        "risk_score": r.risk_score,
        "severity": r.severity,
        "detection_signals": r.detection_signals or [],
        "extracted_urls": r.extracted_urls or [],
        "attachments": r.attachment_info or [],
        "forensic_data": r.forensic_data or {},
        "recommended_actions": r.recommended_actions or [],
        "analysis_mode": r.analysis_mode,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


@router.get("/history")
async def get_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=""),
    classification: str = Query(default=""),
    sort: str = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    q = select(EmailAnalysis)

    if search:
        term = f"%{search}%"
        q = q.where(or_(
            EmailAnalysis.subject.ilike(term),
            EmailAnalysis.sender.ilike(term),
        ))
    if classification and classification != "all":
        q = q.where(EmailAnalysis.classification == classification)

    count_q = select(func.count()).select_from(q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    if sort == "asc":
        q = q.order_by(EmailAnalysis.created_at.asc())
    else:
        q = q.order_by(EmailAnalysis.created_at.desc())

    q = q.offset(offset).limit(page_size)
    result = await db.execute(q)
    rows = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [_row_to_summary(r) for r in rows],
    }


@router.get("/history/{analysis_id}")
async def get_analysis(analysis_id: int, db: AsyncSession = Depends(get_db)):
    from fastapi import HTTPException
    result = await db.get(EmailAnalysis, analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _row_to_full(result)
