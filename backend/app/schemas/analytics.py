from typing import List, Dict, Any
from pydantic import BaseModel


class StatusCount(BaseModel):
    status: str
    count: int


class SpecialtyCount(BaseModel):
    specialization: str
    count: int


class ClinicAnalyticsResponse(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    completed_consultations: int
    upcoming_appointments: int
    total_revenue_usd: float
    appointments_by_status: List[StatusCount]
    doctors_by_specialty: List[SpecialtyCount]
    recent_activity_count: int
