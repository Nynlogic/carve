import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CareFlow Telemedicine Platform"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security & Auth
    SECRET_KEY: str = "careflow-super-secure-production-ready-jwt-secret-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # AWS Cognito (Optional switch for cloud vs local development)
    USE_AWS_COGNITO: bool = False
    COGNITO_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: Optional[str] = None
    COGNITO_CLIENT_ID: Optional[str] = None

    # Database
    DATABASE_URL: str = "sqlite:///./careflow.db"

    # AWS Services
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None

    # AWS S3 Storage
    STORAGE_MODE: str = "local"  # "s3" or "local"
    S3_BUCKET_NAME: str = "careflow-medical-records-storage"
    S3_PRESIGNED_EXPIRATION: int = 900  # 15 minutes
    LOCAL_UPLOAD_DIR: str = os.getenv(
        "LOCAL_UPLOAD_DIR",
        os.path.expanduser("~/Desktop/careflow_downloads")
    )

    # AWS SQS & SNS
    SQS_NOTIFICATION_QUEUE_URL: Optional[str] = None
    SNS_ALERT_TOPIC_ARN: Optional[str] = None

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
