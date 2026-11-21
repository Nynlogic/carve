import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.doctor import DoctorProfile
from app.models.notification import Notification, NotificationType
from app.models.patient import PatientProfile
from app.models.prescription import Prescription
from app.models.user import User, UserRole
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.services.sqs_sns_service import queue_service

router = APIRouter()


@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def issue_prescription(
    rx_in: PrescriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    """
    Doctor issues a digitally-signed electronic prescription (e-Rx) with medication list,
    dosage instructions, and unique verifiable code.
    """
    doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    appointment = db.query(Appointment).filter(Appointment.id == rx_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Doctor does not own this appointment.")

    rx_code = f"RX-{uuid.uuid4().hex[:8].upper()}"
    meds_json = json.dumps([m.model_dump() for m in rx_in.medications])

    prescription = Prescription(
        appointment_id=appointment.id,
        doctor_id=doctor.id,
        patient_id=appointment.patient_id,
        prescription_code=rx_code,
        medications_json=meds_json,
        general_instructions=rx_in.general_instructions,
        is_dispensed=False
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)

    # Notify patient
    patient_profile = db.query(PatientProfile).filter(PatientProfile.id == appointment.patient_id).first()
    if patient_profile:
        notif = Notification(
            user_id=patient_profile.user_id,
            title="Prescription Issued",
            message=f"Dr. {current_user.full_name} has issued an electronic prescription ({rx_code}).",
            notification_type=NotificationType.PRESCRIPTION_READY
        )
        db.add(notif)
        db.commit()

    # Async SQS dispatch
    queue_service.dispatch_appointment_event(
        event_type="PRESCRIPTION_ISSUED",
        payload={
            "prescription_code": rx_code,
            "patient_id": appointment.patient_id,
            "doctor_name": current_user.full_name
        }
    )

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="ISSUE_PRESCRIPTION",
        resource_type="Prescription",
        resource_id=str(prescription.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"prescription_code": rx_code, "appointment_id": appointment.id}
    )

    return prescription


@router.get("/appointment/{appointment_id}", response_model=List[PrescriptionResponse])
def get_prescriptions_for_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch prescriptions associated with a specific appointment."""
    prescriptions = db.query(Prescription).filter(Prescription.appointment_id == appointment_id).all()
    return prescriptions


@router.get("/my-prescriptions", response_model=List[PrescriptionResponse])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    """Patient retrieves their entire digital prescription history."""
    patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not patient:
        return []
    return db.query(Prescription).filter(Prescription.patient_id == patient.id).order_by(Prescription.created_at.desc()).all()
