from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[AuditLogResponse])
def get_audit_trail(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Admin-only: Retrieve immutable HIPAA-compliant audit logs for regulatory oversight."""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action.upper())
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (AuditLog.actor_email.ilike(search_filter))
            | (AuditLog.action.ilike(search_filter))
            | (AuditLog.resource_id.ilike(search_filter))
            | (AuditLog.ip_address.ilike(search_filter))
        )

    total = query.count()
    items = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }
