import os


def _csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./quicknotes.db")
    CORS_ORIGINS: list[str] = _csv(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,https://*.monkeycode-ai.live",
        )
    )


settings = Settings()
