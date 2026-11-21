import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.consultation import ConsultationNote
from app.models.doctor import DoctorProfile
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.consultation import ConsultationNoteCreate, ConsultationNoteResponse

router = APIRouter()


@router.post("/notes", response_model=ConsultationNoteResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_consultation_note(
    note_in: ConsultationNoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    """
    Doctor writes or updates SOAP clinical documentation for an appointment.
    Automatically marks appointment as COMPLETED if not already.
    """
    doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    appointment = db.query(Appointment).filter(Appointment.id == note_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Doctor does not own this appointment.")

    vitals_str = json.dumps(note_in.vitals.model_dump()) if note_in.vitals else None

    # Check if note already exists
    existing_note = db.query(ConsultationNote).filter(ConsultationNote.appointment_id == appointment.id).first()
    if existing_note:
        existing_note.subjective = note_in.subjective
        existing_note.objective = note_in.objective
        existing_note.assessment = note_in.assessment
        existing_note.plan = note_in.plan
        existing_note.icd_codes = note_in.icd_codes
        if vitals_str:
            existing_note.vitals_json = vitals_str
        note = existing_note
    else:
        note = ConsultationNote(
            appointment_id=appointment.id,
            doctor_id=doctor.id,
            patient_id=appointment.patient_id,
            subjective=note_in.subjective,
            objective=note_in.objective,
            assessment=note_in.assessment,
            plan=note_in.plan,
            icd_codes=note_in.icd_codes,
            vitals_json=vitals_str
        )
        db.add(note)

    # Transition appointment status to COMPLETED
    appointment.status = AppointmentStatus.COMPLETED

    db.commit()
    db.refresh(note)

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="RECORD_SOAP_NOTE",
        resource_type="ConsultationNote",
        resource_id=str(note.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"appointment_id": appointment.id, "patient_id": appointment.patient_id}
    )

    return note


@router.get("/notes/{appointment_id}", response_model=ConsultationNoteResponse)
def get_consultation_note(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve clinical notes for an appointment with HIPAA-mandated audit access logging."""
    note = db.query(ConsultationNote).filter(ConsultationNote.appointment_id == appointment_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Consultation note not found for this appointment.")

    # Access authorization
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient or note.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
        if not doctor or note.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="VIEW_CLINICAL_NOTE",
        resource_type="ConsultationNote",
        resource_id=str(note.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"]
    )

    return note
