import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Mock Interview Assistant API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # AI Provider: 'gemini', 'openai', or 'mock'
    AI_PROVIDER: str = "gemini"
    AI_MODEL: str = "gemini-2.5-flash"
    
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    DATABASE_URL: str = "sqlite:///./interview_assistant.db"
    
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8443,http://127.0.0.1:5173,http://127.0.0.1:8443,*"
    
    @property
    def cors_origin_list(self) -> List[str]:
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
