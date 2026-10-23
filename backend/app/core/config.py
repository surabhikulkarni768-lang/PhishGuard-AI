"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "dev-secret-key"
    database_url: str = "sqlite+aiosqlite:///./phishguard.db"
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    max_upload_size_mb: int = 5
    enable_dns_checks: bool = False
    virustotal_api_key: str = ""
    report_dir: str = "./reports"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
