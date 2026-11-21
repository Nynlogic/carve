from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created if running without Alembic runner
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic if any
    pass


app = FastAPI(
    title="CareFlow Telemedicine Platform API",
    description="""
    Production-grade, HIPAA-conscious Cloud-Native Clinic & Telemedicine Platform API.
    
    ### Key Features:
    * **Multi-Role RBAC**: Patients, Doctors, and Clinic Administrators with Cognito/JWT integration.
    * **Doctor Scheduling & Conflict Detection**: Dynamic slot generation and booking.
    * **Telemedicine Rooms**: WebRTC peer-to-peer secure video consultation integration.
    * **SOAP Notes & ICD-10 Coding**: Standardized clinical documentation and vitals.
    * **Electronic Prescriptions (e-Rx)**: Digitally-signed tamper-evident prescriptions.
    * **Secure S3 Medical Records**: Direct client-side presigned upload/download with KMS encryption.
    * **Immutable Audit Trail**: Regulatory access tracking across all PHI resources.
    * **Cloud-Native Decoupling**: SQS asynchronous reminder queue & SNS alerts.
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health & Readiness"])
def health_check():
    """Liveness probe for AWS Application Load Balancer."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/ready", tags=["Health & Readiness"])
def readiness_check():
    """Readiness probe checking database connectivity."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "storage_mode": settings.STORAGE_MODE
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database_error": str(e)}
        )
    finally:
        db.close()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Standardized error envelope preventing sensitive stack trace leaks in production."""
    if settings.DEBUG:
        error_detail = str(exc)
    else:
        error_detail = "An internal server error occurred. Please contact clinic support."

    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": error_detail,
            "path": request.url.path
        }
    )
