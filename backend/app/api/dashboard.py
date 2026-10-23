"""GET /api/dashboard/stats — aggregate statistics for the dashboard."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from app.db.database import get_db
from app.models.email_analysis import EmailAnalysis
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/dashboard/stats")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Totals per classification
    totals_q = select(
        func.count(EmailAnalysis.id).label("total"),
        func.sum(case((EmailAnalysis.classification == "safe", 1), else_=0)).label("safe"),
        func.sum(case((EmailAnalysis.classification == "suspicious", 1), else_=0)).label("suspicious"),
        func.sum(case((EmailAnalysis.classification == "phishing", 1), else_=0)).label("phishing"),
    )
    totals_result = await db.execute(totals_q)
    totals = totals_result.one()

    # Last 7 days daily breakdown
    seven_days = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day)
        day_end = day_start + timedelta(days=1)
        q = select(
            func.count(EmailAnalysis.id).label("total"),
            func.sum(case((EmailAnalysis.classification == "safe", 1), else_=0)).label("safe"),
            func.sum(case((EmailAnalysis.classification == "suspicious", 1), else_=0)).label("suspicious"),
            func.sum(case((EmailAnalysis.classification == "phishing", 1), else_=0)).label("phishing"),
        ).where(
            EmailAnalysis.created_at >= day_start,
            EmailAnalysis.created_at < day_end,
        )
        r = await db.execute(q)
        row = r.one()
        seven_days.append({
            "date": day.strftime("%b %d"),
            "total": row.total or 0,
            "safe": row.safe or 0,
            "suspicious": row.suspicious or 0,
            "phishing": row.phishing or 0,
        })

    # Recent high-risk (phishing) — last 5
    recent_q = (
        select(EmailAnalysis)
        .where(EmailAnalysis.classification == "phishing")
        .order_by(EmailAnalysis.created_at.desc())
        .limit(5)
    )
    recent_r = await db.execute(recent_q)
    recent_alerts = [
        {
            "id": r.id,
            "subject": r.subject,
            "sender": r.sender,
            "risk_score": r.risk_score,
            "severity": r.severity,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent_r.scalars().all()
    ]

    # Recent analyses (any type) — last 10
    recent_any_q = (
        select(EmailAnalysis)
        .order_by(EmailAnalysis.created_at.desc())
        .limit(10)
    )
    recent_any_r = await db.execute(recent_any_q)
    recent_analyses = [
        {
            "id": r.id,
            "subject": r.subject,
            "sender": r.sender,
            "classification": r.classification,
            "risk_score": r.risk_score,
            "severity": r.severity,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent_any_r.scalars().all()
    ]

    return {
        "total": totals.total or 0,
        "safe": totals.safe or 0,
        "suspicious": totals.suspicious or 0,
        "phishing": totals.phishing or 0,
        "daily_stats": seven_days,
        "recent_alerts": recent_alerts,
        "recent_analyses": recent_analyses,
    }
