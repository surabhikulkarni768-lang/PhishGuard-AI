"""SQLAlchemy ORM models."""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.db.database import Base


class EmailAnalysis(Base):
    __tablename__ = "email_analyses"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(500), default="")
    sender = Column(String(300), default="")
    recipient = Column(String(300), default="")
    raw_headers = Column(Text, default="")
    raw_body = Column(Text, default="")
    classification = Column(String(20), default="unknown")  # safe | suspicious | phishing
    risk_score = Column(Float, default=0.0)
    severity = Column(String(20), default="low")  # low | medium | high | critical
    detection_signals = Column(JSON, default=list)
    extracted_urls = Column(JSON, default=list)
    attachment_info = Column(JSON, default=list)
    forensic_data = Column(JSON, default=dict)
    recommended_actions = Column(JSON, default=list)
    analysis_mode = Column(String(20), default="rule-based")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
