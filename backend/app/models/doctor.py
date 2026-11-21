from datetime import time
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Boolean, Time
from sqlalchemy.orm import relationship
from app.core.database import Base


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String(100), nullable=False, index=True)
    license_number = Column(String(100), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=100.0, nullable=False)
    experience_years = Column(Integer, default=5, nullable=False)
    hospital_affiliation = Column(String(200), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.9, nullable=False)
    total_reviews = Column(Integer, default=12, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    availability_slots = relationship("AvailabilitySlot", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    doctor = relationship("DoctorProfile", back_populates="availability_slots")
