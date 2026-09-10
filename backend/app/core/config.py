"""Application settings loaded from environment / .env file."""
from functools import lru_cache
import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
IS_VERCEL = os.getenv("VERCEL") == "1"
RUNTIME_DIR = Path("/tmp/bis-assist") if IS_VERCEL else BASE_DIR


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "BIS AI Standards Assistant"
    environment: str = "development"
    api_prefix: str = "/api"
    host: str = "0.0.0.0"
    port: int = 8000

    # Security
    jwt_secret: str = "dev-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    cors_origins: str = "*"

    # Database
    database_url: str = f"sqlite:///{(RUNTIME_DIR / 'bis_assistant.db').as_posix()}"

    # Google AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"

    # Rate limiting
    rate_limit_calls: int = 120
    rate_limit_window_seconds: int = 60

    # Uploads
    max_image_mb: int = 10
    max_pdf_mb: int = 15

    # Paths
    data_dir: Path = BASE_DIR / "data"
    documents_dir: Path = BASE_DIR / "data" / "bis_documents"
    uploads_dir: Path = RUNTIME_DIR / "uploads"

    # Extra production frontends (comma-separated) merged with cors_origins.
    # Set FRONTEND_URL=https://<your-frontend>.vercel.app in Vercel backend env.
    frontend_url: str = ""
    extra_cors_origins: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        seen: list[str] = []
        for raw in (self.cors_origins, self.extra_cors_origins, self.frontend_url):
            for origin in (raw or "").replace(";", ",").split(","):
                origin = origin.strip().rstrip("/")
                if origin and origin not in seen:
                    seen.append(origin)
        # A wildcard lets any deployed Vercel preview URL (+ localhost) call
        # the API without touching backend env vars on every redeploy.
        if "*" in seen:
            return ["*"]
        return seen

    @property
    def cors_allow_credentials(self) -> bool:
        # Browsers reject `Access-Control-Allow-Credentials: true` together with
        # `Access-Control-Allow-Origin: *`, so credentials must be off in wildcard mode.
        return "*" not in self.cors_origin_list

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def ai_configured(self) -> bool:
        return bool(self.gemini_api_key)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    return settings