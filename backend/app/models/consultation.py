from datetime import datetime, timezone
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class ConsultationNote(Base):
    __tablename__ = "consultation_notes"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # SOAP Note Structure (Standard Clinical Documentation)
    subjective = Column(Text, nullable=False)  # Patient symptoms, complaints, history
    objective = Column(Text, nullable=False)   # Physical exam findings, observation
    assessment = Column(Text, nullable=False)  # Clinical judgment, diagnosis
    plan = Column(Text, nullable=False)        # Treatment plan, follow-up, tests ordered
    
    icd_codes = Column(Text, nullable=True)     # Comma-separated or JSON list of ICD-10 codes
    vitals_json = Column(Text, nullable=True)   # JSON: {"bp": "120/80", "hr": 72, "temp": 98.6, "spo2": 99}
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    appointment = relationship("Appointment", back_populates="consultation_notes")
