from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    openai_api_key: str
    tavily_api_key: str
    groq_api_key: str = ""

    # Database
    database_url: str

    # App
    environment: str = "development"
    secret_key: str = "supersecretkey123"
    app_name: str = "AI Research Agent"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()