import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from fastapi import Request


def log_audit_event(
    db: Session,
    actor_id: Optional[int],
    actor_email: Optional[str],
    actor_role: Optional[str],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Persist an immutable audit log entry for compliance and security auditing.
    Lazy imports AuditLog model to prevent circular dependencies.
    """
    try:
        from app.models.audit_log import AuditLog
        
        details_str = json.dumps(details) if details else None
        
        audit_entry = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email or "system",
            actor_role=actor_role or "SYSTEM",
            action=action.upper(),
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            ip_address=ip_address or "127.0.0.1",
            user_agent=user_agent or "unknown",
            details=details_str,
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Ensure audit logger failure doesn't crash the primary transaction, but log to stderr
        print(f"[AUDIT_ERROR] Failed to record audit log: {str(e)}")


def extract_client_info(request: Optional[Request]) -> Dict[str, str]:
    """Helper to extract IP and user agent safely from FastAPI Request."""
    if not request:
        return {"ip_address": "unknown", "user_agent": "unknown"}
        
    client_ip = (
        request.headers.get("x-forwarded-for")
        or (request.client.host if request.client else "127.0.0.1")
    )
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
        
    user_agent = request.headers.get("user-agent", "unknown")
    return {"ip_address": client_ip, "user_agent": user_agent}
