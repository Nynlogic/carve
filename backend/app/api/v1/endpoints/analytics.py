from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.audit_log import AuditLog
from app.models.doctor import DoctorProfile
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.analytics import ClinicAnalyticsResponse, SpecialtyCount, StatusCount

router = APIRouter()


@router.get("/overview", response_model=ClinicAnalyticsResponse)
def get_clinic_analytics_overview(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Admin-only: Aggregate operational, financial, and clinical KPIs."""
    total_patients = db.query(PatientProfile).count()
    total_doctors = db.query(DoctorProfile).filter(DoctorProfile.is_verified == True).count()
    total_appointments = db.query(Appointment).count()
    
    completed_consultations = (
        db.query(Appointment)
        .filter(Appointment.status == AppointmentStatus.COMPLETED)
        .count()
    )

    upcoming_appointments = (
        db.query(Appointment)
        .filter(Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]))
        .count()
    )

    # Calculate estimated revenue from completed consultations
    revenue_query = (
        db.query(func.coalesce(func.sum(DoctorProfile.consultation_fee), 0.0))
        .join(Appointment, Appointment.doctor_id == DoctorProfile.id)
        .filter(Appointment.status == AppointmentStatus.COMPLETED)
        .scalar()
    )
    total_revenue_usd = float(revenue_query or 0.0)

    # Status distribution
    status_group = (
        db.query(Appointment.status, func.count(Appointment.id))
        .group_by(Appointment.status)
        .all()
    )
    appointments_by_status = [
        StatusCount(status=str(s.value), count=c) for s, c in status_group
    ]

    # Specialty distribution
    specialty_group = (
        db.query(DoctorProfile.specialization, func.count(DoctorProfile.id))
        .group_by(DoctorProfile.specialization)
        .all()
    )
    doctors_by_specialty = [
        SpecialtyCount(specialization=s, count=c) for s, c in specialty_group
    ]

    recent_activity_count = db.query(AuditLog).count()

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments": total_appointments,
        "completed_consultations": completed_consultations,
        "upcoming_appointments": upcoming_appointments,
        "total_revenue_usd": round(total_revenue_usd, 2),
        "appointments_by_status": appointments_by_status,
        "doctors_by_specialty": doctors_by_specialty,
        "recent_activity_count": recent_activity_count
    }
