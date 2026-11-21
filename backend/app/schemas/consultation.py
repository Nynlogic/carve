from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class VitalsSchema(BaseModel):
    blood_pressure: Optional[str] = "120/80"
    heart_rate_bpm: Optional[int] = 72
    temperature_f: Optional[float] = 98.6
    respiratory_rate: Optional[int] = 16
    oxygen_saturation_pct: Optional[int] = 99
    weight_kg: Optional[float] = 70.0
    height_cm: Optional[float] = 175.0


class ConsultationNoteCreate(BaseModel):
    appointment_id: int
    subjective: str
    objective: str
    assessment: str
    plan: str
    icd_codes: Optional[str] = None
    vitals: Optional[VitalsSchema] = None


class ConsultationNoteResponse(BaseModel):
    id: int
    appointment_id: int
    doctor_id: int
    patient_id: int
    subjective: str
    objective: str
    assessment: str
    plan: str
    icd_codes: Optional[str] = None
    vitals_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
