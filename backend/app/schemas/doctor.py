from datetime import time
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse


class AvailabilitySlotBase(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    slot_duration_minutes: int = 30
    is_active: bool = True


class AvailabilitySlotCreate(AvailabilitySlotBase):
    pass


class AvailabilitySlotResponse(AvailabilitySlotBase):
    id: int
    doctor_id: int

    class Config:
        from_attributes = True


class DoctorProfileBase(BaseModel):
    specialization: str
    license_number: str
    bio: Optional[str] = None
    consultation_fee: float = 100.0
    experience_years: int = 5
    hospital_affiliation: Optional[str] = None
    avatar_url: Optional[str] = None


class DoctorProfileCreate(DoctorProfileBase):
    pass


class DoctorProfileResponse(DoctorProfileBase):
    id: int
    user_id: int
    rating: float
    total_reviews: int
    is_verified: bool
    user: Optional[UserResponse] = None
    availability_slots: List[AvailabilitySlotResponse] = []

    class Config:
        from_attributes = True


class AvailableSlotOption(BaseModel):
    start_time: str
    end_time: str
    is_available: bool
