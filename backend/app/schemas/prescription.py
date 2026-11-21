from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = "Take after meals"


class PrescriptionCreate(BaseModel):
    appointment_id: int
    medications: List[MedicationItem]
    general_instructions: Optional[str] = None


class PrescriptionResponse(BaseModel):
    id: int
    appointment_id: int
    doctor_id: int
    patient_id: int
    prescription_code: str
    medications_json: str
    general_instructions: Optional[str] = None
    is_dispensed: bool
    signed_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
