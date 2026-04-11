"""
Central config — reads from .env via python-dotenv.
Import `settings` anywhere in the backend.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    port: int = 8000
    environment: str = "development"
    allowed_origins: str = "http://localhost:3000"

    phishtank_db_path: str = "./phishtank_urls.db"

    transformers_cache: str = "./model_cache"
    torch_device: str = "cpu"

    max_requests_per_minute: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()