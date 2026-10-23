"""PhishGuard AI — main FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import init_db
from app.api import analyze, history, dashboard, forensics, report


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="PhishGuard AI",
    description="AI-Powered Email Threat Detection & Digital Forensics Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(forensics.router, prefix="/api", tags=["Forensics"])
app.include_router(report.router, prefix="/api", tags=["Reports"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "PhishGuard AI"}
