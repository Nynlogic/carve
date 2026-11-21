from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.doctor import AvailabilitySlot, DoctorProfile
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.doctor import (
    AvailabilitySlotCreate,
    AvailabilitySlotResponse,
    AvailableSlotOption,
    DoctorProfileResponse,
)
from app.services.appointment_service import get_available_slots_for_doctor

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[DoctorProfileResponse])
def list_doctors(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    specialization: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Browse and search verified doctors by name, specialty, and hospital."""
    query = (
        db.query(DoctorProfile)
        .join(User, DoctorProfile.user_id == User.id)
        .filter(DoctorProfile.is_verified == True, User.is_active == True)
    )

    if specialization:
        query = query.filter(DoctorProfile.specialization.ilike(f"%{specialization}%"))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter))
            | (DoctorProfile.specialization.ilike(search_filter))
            | (DoctorProfile.hospital_affiliation.ilike(search_filter))
        )

    total = query.count()
    items = query.order_by(DoctorProfile.rating.desc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }


@router.get("/{doctor_id}", response_model=DoctorProfileResponse)
def get_doctor_details(doctor_id: int, db: Session = Depends(get_db)):
    """Fetch complete public profile of a doctor including schedule template."""
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.get("/{doctor_id}/available-slots", response_model=List[AvailableSlotOption])
def get_doctor_available_slots(
    doctor_id: int,
    target_date: date = Query(..., description="Date for consultation (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Compute dynamic available time slots for booking with a doctor on the specified date.
    Excludes already booked or past slots.
    """
    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    slots = get_available_slots_for_doctor(db=db, doctor_id=doctor_id, target_date=target_date)
    return slots


@router.post("/availability/batch", response_model=List[AvailabilitySlotResponse])
def configure_doctor_availability(
    slots_in: List[AvailabilitySlotCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    """Doctor sets up their weekly schedule availability templates."""
    doctor = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    # Replace existing slots
    db.query(AvailabilitySlot).filter(AvailabilitySlot.doctor_id == doctor.id).delete()

    created_slots = []
    for slot_item in slots_in:
        slot = AvailabilitySlot(
            doctor_id=doctor.id,
            day_of_week=slot_item.day_of_week,
            start_time=slot_item.start_time,
            end_time=slot_item.end_time,
            slot_duration_minutes=slot_item.slot_duration_minutes,
            is_active=slot_item.is_active
        )
        db.add(slot)
        created_slots.append(slot)

    db.commit()
    for s in created_slots:
        db.refresh(s)

    return created_slots
