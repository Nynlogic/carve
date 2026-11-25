from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.config import settings
from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.consultation import ConsultationNote
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.medical_record import MedicalRecord
from app.models.notification import Notification
from app.models.patient import PatientProfile
from app.models.prescription import Prescription
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


@router.get("/patients-list")
def list_all_patients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN]))
):
    """List patients for clinicians and administrators."""
    query = db.query(PatientProfile).join(User, PatientProfile.user_id == User.id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) | (User.email.ilike(search_filter))
        )
    profiles = query.all()
    
    result = []
    for p in profiles:
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "full_name": p.user.full_name,
            "email": p.user.email,
            "phone": p.user.phone,
            "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "emergency_contact": p.emergency_contact,
            "allergies": p.allergies,
            "chronic_conditions": p.chronic_conditions,
            "insurance_provider": p.insurance_provider,
            "insurance_policy_number": p.insurance_policy_number
        })
    return result


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


@router.post("/clean-slate")
def reset_clean_slate(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """
    Reset platform to a clean canvas: removes all mock doctors, patients,
    appointments, notes, prescriptions, and records.
    Keeps only the Admin account so user can add their own doctor and patient details!
    """
    if not settings.ENABLE_DEMO_ENDPOINTS:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        # Delete dependent data
        db.query(ConsultationNote).delete()
        db.query(Prescription).delete()
        db.query(MedicalRecord).delete()
        db.query(Appointment).delete()
        db.query(AvailabilitySlot).delete()
        db.query(DoctorProfile).delete()
        db.query(PatientProfile).delete()
        db.query(Notification).delete()
        
        # Delete non-admin users
        db.query(User).filter(User.role != UserRole.ADMIN).delete()
        
        db.commit()
        return {
            "status": "success",
            "message": "Clean canvas activated! All mock doctors and patients removed. You can now add your own doctors and patients."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
