from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    prescription_code = Column(String(50), unique=True, nullable=False, index=True)
    # JSON array of medications: [{"name": "Amoxicillin", "dosage": "500mg", "frequency": "TID", "duration": "7 days", "instructions": "Take after meals"}]
    medications_json = Column(Text, nullable=False)
    general_instructions = Column(Text, nullable=True)
    is_dispensed = Column(Boolean, default=False, nullable=False)
    signed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    appointment = relationship("Appointment", back_populates="prescriptions")
