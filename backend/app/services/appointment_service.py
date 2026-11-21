from datetime import date, datetime, time, timedelta
from typing import List, Dict, Any
import uuid
from sqlalchemy.orm import Session
from app.models.appointment import Appointment, AppointmentStatus
from app.models.doctor import DoctorProfile, AvailabilitySlot


def generate_telemedicine_room_id() -> str:
    """Generate unique secure WebRTC telemedicine room token."""
    return f"cf-telemed-{uuid.uuid4().hex[:12]}"


def get_available_slots_for_doctor(
    db: Session,
    doctor_id: int,
    target_date: date
) -> List[Dict[str, Any]]:
    """
    Compute available booking slots for a doctor on a target date based on:
    1. Active AvailabilitySlot configuration for that day of week (0=Monday, 6=Sunday)
    2. Excluding existing non-cancelled appointments
    """
    day_of_week = target_date.weekday()
    
    # Fetch doctor availability template for this day of week
    slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.doctor_id == doctor_id,
            AvailabilitySlot.day_of_week == day_of_week,
            AvailabilitySlot.is_active == True
        )
        .all()
    )

    if not slots:
        # Fallback default schedule if none explicitly configured: 09:00 to 17:00
        slot_duration = 30
        working_blocks = [(time(9, 0), time(17, 0))]
    else:
        slot_duration = slots[0].slot_duration_minutes
        working_blocks = [(s.start_time, s.end_time) for s in slots]

    # Fetch existing booked appointments for the day
    existing_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == target_date,
            Appointment.status.notin_([AppointmentStatus.CANCELLED])
        )
        .all()
    )
    booked_times = {(apt.start_time, apt.end_time) for apt in existing_appointments}

    available_slots: List[Dict[str, Any]] = []

    for block_start, block_end in working_blocks:
        curr_dt = datetime.combine(target_date, block_start)
        end_dt = datetime.combine(target_date, block_end)

        while curr_dt + timedelta(minutes=slot_duration) <= end_dt:
            slot_start = curr_dt.time()
            slot_end = (curr_dt + timedelta(minutes=slot_duration)).time()
            
            is_booked = (slot_start, slot_end) in booked_times
            
            # If target date is today, omit past slots
            now = datetime.now()
            is_past = (target_date == now.date()) and (slot_start < now.time())

            available_slots.append({
                "start_time": slot_start.strftime("%H:%M:%S"),
                "end_time": slot_end.strftime("%H:%M:%S"),
                "is_available": (not is_booked) and (not is_past)
            })

            curr_dt += timedelta(minutes=slot_duration)

    return available_slots
