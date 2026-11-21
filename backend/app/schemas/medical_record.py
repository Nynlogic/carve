from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel
from app.models.medical_record import DocumentCategory


class PresignedUploadRequest(BaseModel):
    file_name: str
    mime_type: str
    file_size_bytes: int
    category: DocumentCategory = DocumentCategory.LAB_REPORT
    title: str
    description: Optional[str] = None
    patient_id: Optional[int] = None  # If uploaded by doctor/admin for patient


class PresignedUploadResponse(BaseModel):
    upload_url: str
    file_key: str
    fields: Optional[Dict[str, str]] = None
    expires_in_seconds: int


class PresignedDownloadResponse(BaseModel):
    download_url: str
    file_name: str
    mime_type: str
    expires_in_seconds: int


class MedicalRecordCreate(BaseModel):
    patient_id: int
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_key: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    checksum_sha256: Optional[str] = None


class MedicalRecordResponse(BaseModel):
    id: int
    patient_id: int
    uploaded_by_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    category: DocumentCategory
    file_key: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    s3_bucket: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
