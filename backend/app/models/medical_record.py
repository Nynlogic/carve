import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Enum, BigInteger, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentCategory(str, enum.Enum):
    LAB_REPORT = "LAB_REPORT"
    IMAGING = "IMAGING"
    PRESCRIPTION = "PRESCRIPTION"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    CLINICAL_NOTE = "CLINICAL_NOTE"
    OTHER = "OTHER"


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(DocumentCategory), default=DocumentCategory.LAB_REPORT, nullable=False, index=True)
    
    file_key = Column(String(500), unique=True, nullable=False)  # S3 object key or relative storage path
    file_name = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    s3_bucket = Column(String(255), nullable=True)
    checksum_sha256 = Column(String(64), nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    patient = relationship("PatientProfile", back_populates="medical_records")
    uploader = relationship("User", foreign_keys=[uploaded_by_id])
