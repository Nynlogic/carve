from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.database import get_db
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user import PatientProfileResponse, UserResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Admin-only: list registered platform users with search and pagination."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) | (User.email.ilike(search_filter))
        )

    total = query.count()
    items = query.order_by(User.id.desc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    is_active: bool,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Admin-only: activate or deactivate user accounts."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = is_active
    db.commit()
    db.refresh(target_user)

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=admin.id,
        actor_email=admin.email,
        actor_role=admin.role.value,
        action="UPDATE_USER_STATUS",
        resource_type="User",
        resource_id=str(target_user.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"new_active_status": is_active}
    )

    return target_user


@router.put("/me/patient-profile", response_model=PatientProfileResponse)
def update_my_patient_profile(
    profile_data: PatientProfileResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    """Allow patient to update their medical history, allergies, and emergency contact."""
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    for field, val in profile_data.model_dump(exclude={"id"}, exclude_unset=True).items():
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return profile
