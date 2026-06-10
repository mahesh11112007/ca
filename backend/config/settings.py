import os
from dotenv import load_dotenv

load_dotenv()

_settings = None


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        self.DATABASE_URL = os.environ.get("DATABASE_URL")
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is required")

        self.JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
        if not self.JWT_SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY environment variable is required")

        self.JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
        self.JWT_EXPIRATION_MINUTES = int(
            os.environ.get("JWT_EXPIRATION_MINUTES", "1440")
        )

        cors_origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
        self.CORS_ORIGINS = [
            origin.strip() for origin in cors_origins_str.split(",") if origin.strip()
        ]


def get_settings() -> Settings:
    """Return cached settings instance (singleton)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
