import time
import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal

# Track startup timestamp for uptime telemetry
START_TIME = datetime.now(timezone.utc)

# Rate limiting sliding window cache: ip -> list of timestamps
RATE_LIMIT_BUCKET: dict = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_AUTH_REQUESTS = 20  # max auth attempts per minute


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created if running without Alembic runner
    if settings.ENVIRONMENT.lower() != "production":
        Base.metadata.create_all(bind=engine)  # production schema is managed by Alembic
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


@app.middleware("http")
async def security_and_observability_middleware(request: Request, call_next):
    """
    Production-grade HTTP middleware:
    1. Attaches X-Request-ID for distributed tracing across ECS & CloudWatch
    2. Calculates X-Process-Time execution latency
    3. Enforces rate limiting on sensitive authentication endpoints
    4. Sets OWASP recommended defense-in-depth security headers
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    # Rate Limiting on Authentication endpoints
    client_ip = request.client.host if request.client else "127.0.0.1"
    if request.url.path.startswith(f"{settings.API_V1_STR}/auth/"):
        current_ts = time.time()
        # Clean older requests outside the window
        RATE_LIMIT_BUCKET[client_ip] = [
            ts for ts in RATE_LIMIT_BUCKET[client_ip] if current_ts - ts < RATE_LIMIT_WINDOW
        ]
        if len(RATE_LIMIT_BUCKET[client_ip]) >= RATE_LIMIT_MAX_AUTH_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "RateLimitExceeded",
                    "message": "Too many authentication requests. Please wait a minute before trying again."
                },
                headers={"Retry-After": str(RATE_LIMIT_WINDOW)}
            )
        RATE_LIMIT_BUCKET[client_ip].append(current_ts)

    # Process request
    response = await call_next(request)

    # Calculate execution time
    process_time = time.time() - start_time

    # Attach Observability Headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"

    # Attach OWASP Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"

    return response


# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health & Readiness"])
def health_check():
    """Liveness probe for AWS Application Load Balancer."""
    uptime_seconds = int((datetime.now(timezone.utc) - START_TIME).total_seconds())
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/health/ready", tags=["Health & Readiness"])
def readiness_check():
    """Readiness probe checking database connectivity and storage state."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "storage_mode": settings.STORAGE_MODE,
            "aws_cognito_enabled": settings.USE_AWS_COGNITO,
            "aws_region": settings.AWS_REGION
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "unreachable"}
        )
    finally:
        db.close()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Standardized error envelope preventing sensitive stack trace leaks in production."""
    import logging
    logging.getLogger("careflow").exception("Unhandled error on %s", request.url.path)
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
