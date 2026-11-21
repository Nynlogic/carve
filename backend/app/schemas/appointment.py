from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel
from app.models.appointment import AppointmentStatus, AppointmentType
from app.schemas.doctor import DoctorProfileResponse
from app.schemas.user import UserResponse


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    reason: str
    appointment_type: AppointmentType = AppointmentType.TELEMEDICINE


class AppointmentReschedule(BaseModel):
    new_date: date
    new_start_time: time
    new_end_time: time
    reason: Optional[str] = "Rescheduled by patient/doctor"


class AppointmentCancel(BaseModel):
    cancellation_reason: str


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentPatientResponse(BaseModel):
    id: int
    user_id: int
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    appointment_type: AppointmentType
    reason: str
    telemedicine_room_id: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    doctor: Optional[DoctorProfileResponse] = None
    patient: Optional[AppointmentPatientResponse] = None

    class Config:
        from_attributes = True
