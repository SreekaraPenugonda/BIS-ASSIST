"""Application settings loaded from environment / .env file."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/


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
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,https://localhost:5173,https://127.0.0.1:5173"

    # Database
    database_url: str = f"sqlite:///{(BASE_DIR / 'bis_assistant.db').as_posix()}"

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
    uploads_dir: Path = BASE_DIR / "uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

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