from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.doctor import DoctorProfile
from app.models.notification import Notification, NotificationType
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.schemas.common import PaginatedResponse
from app.services.appointment_service import generate_telemedicine_room_id
from app.services.sqs_sns_service import queue_service

router = APIRouter()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def book_appointment(
    apt_in: AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Book an appointment. Validates slot availability, prevents double-booking,
    creates secure telemedicine room token if applicable, and enqueues async reminder.
    """
    # Determine patient profile
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient:
            # Auto-create patient profile if missing
            patient = PatientProfile(user_id=current_user.id)
            db.add(patient)
            db.flush()
    else:
        raise HTTPException(status_code=403, detail="Appointments must be booked by or on behalf of a patient.")

    # Validate doctor exists
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == apt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Conflict check
    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == apt_in.doctor_id,
            Appointment.appointment_date == apt_in.appointment_date,
            Appointment.start_time == apt_in.start_time,
            Appointment.status.notin_([AppointmentStatus.CANCELLED])
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested time slot has already been booked. Please choose another slot."
        )

    # Generate telemedicine room ID if online consultation
    room_id = generate_telemedicine_room_id() if apt_in.appointment_type == AppointmentType.TELEMEDICINE else None

    appointment = Appointment(
        patient_id=patient.id,
        doctor_id=apt_in.doctor_id,
        appointment_date=apt_in.appointment_date,
        start_time=apt_in.start_time,
        end_time=apt_in.end_time,
        reason=apt_in.reason,
        appointment_type=apt_in.appointment_type,
        status=AppointmentStatus.CONFIRMED,
        telemedicine_room_id=room_id
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    # Create internal notification
    doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
    if doctor_user:
        notif = Notification(
            user_id=doctor_user.id,
            title="New Appointment Booked",
            message=f"Patient {current_user.full_name} booked a consultation on {appointment.appointment_date} at {appointment.start_time}.",
            notification_type=NotificationType.APPOINTMENT_CONFIRMED
        )
        db.add(notif)
        db.commit()

    # Async SQS dispatch for notification/email worker
    queue_service.dispatch_appointment_event(
        event_type="APPOINTMENT_BOOKED",
        payload={
            "appointment_id": appointment.id,
            "patient_email": current_user.email,
            "doctor_name": doctor_user.full_name if doctor_user else "Doctor",
            "date": str(appointment.appointment_date),
            "time": str(appointment.start_time),
            "telemedicine_room_id": room_id
        }
    )

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="BOOK_APPOINTMENT",
        resource_type="Appointment",
        resource_id=str(appointment.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"doctor_id": apt_in.doctor_id, "date": str(apt_in.appointment_date)}
    )

    return appointment


@router.get("/", response_model=PaginatedResponse[AppointmentResponse])
def list_appointments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    status: Optional[AppointmentStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List appointments. Role-scoped:
    - Patient sees only their appointments
    - Doctor sees their schedule
    - Admin sees all clinic appointments
    """
    query = db.query(Appointment)

    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient:
            return {"items": [], "total": 0, "page": page, "size": size, "total_pages": 0}
        query = query.filter(Appointment.patient_id == patient.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not doctor:
            return {"items": [], "total": 0, "page": page, "size": size, "total_pages": 0}
        query = query.filter(Appointment.doctor_id == doctor.id)

    if status:
        query = query.filter(Appointment.status == status)

    total = query.count()
    items = (
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    total_pages = (total + size - 1) // size

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch single appointment details with security permission check."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Access control
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient or appointment.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    return appointment


@router.patch("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status_update: AppointmentStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update appointment status (e.g. IN_PROGRESS, COMPLETED)."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appointment.status
    appointment.status = status_update.status
    db.commit()
    db.refresh(appointment)

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="UPDATE_APPOINTMENT_STATUS",
        resource_type="Appointment",
        resource_id=str(appointment.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"old_status": old_status.value, "new_status": status_update.status.value}
    )

    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    cancel_data: AppointmentCancel,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an appointment and trigger notification."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancellation_reason = cancel_data.cancellation_reason
    db.commit()
    db.refresh(appointment)

    queue_service.dispatch_appointment_event(
        event_type="APPOINTMENT_CANCELLED",
        payload={
            "appointment_id": appointment.id,
            "cancellation_reason": cancel_data.cancellation_reason,
            "cancelled_by": current_user.email
        }
    )

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="CANCEL_APPOINTMENT",
        resource_type="Appointment",
        resource_id=str(appointment.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"reason": cancel_data.cancellation_reason}
    )

    return appointment


@router.post("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    reschedule_data: AppointmentReschedule,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reschedule an existing appointment to a new date and time."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Conflict check for new slot
    conflict = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == appointment.doctor_id,
            Appointment.appointment_date == reschedule_data.new_date,
            Appointment.start_time == reschedule_data.new_start_time,
            Appointment.id != appointment.id,
            Appointment.status.notin_([AppointmentStatus.CANCELLED])
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=409, detail="New slot is already booked.")

    appointment.appointment_date = reschedule_data.new_date
    appointment.start_time = reschedule_data.new_start_time
    appointment.end_time = reschedule_data.new_end_time
    appointment.status = AppointmentStatus.RESCHEDULED
    db.commit()
    db.refresh(appointment)

    queue_service.dispatch_appointment_event(
        event_type="APPOINTMENT_RESCHEDULED",
        payload={
            "appointment_id": appointment.id,
            "new_date": str(reschedule_data.new_date),
            "new_time": str(reschedule_data.new_start_time)
        }
    )

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="RESCHEDULE_APPOINTMENT",
        resource_type="Appointment",
        resource_id=str(appointment.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"new_date": str(reschedule_data.new_date), "new_time": str(reschedule_data.new_start_time)}
    )

    return appointment
