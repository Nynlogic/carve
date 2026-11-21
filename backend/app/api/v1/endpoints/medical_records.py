import os
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.audit_logger import extract_client_info, log_audit_event
from app.core.config import settings
from app.core.database import get_db
from app.models.doctor import DoctorProfile
from app.models.medical_record import DocumentCategory, MedicalRecord
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.medical_record import (
    MedicalRecordCreate,
    MedicalRecordResponse,
    PresignedDownloadResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
)
from app.services.s3_service import storage_service

router = APIRouter()


@router.post("/upload-request", response_model=PresignedUploadResponse)
def request_presigned_upload_url(
    req: PresignedUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a secure S3 Presigned URL for direct, encrypted upload from the client.
    Protected Health Information (PHI) never passes unencrypted through the backend server.
    """
    patient_id = req.patient_id
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient.id
    elif not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required when uploading as clinical staff.")

    try:
        presigned_info = storage_service.generate_presigned_upload_url(
            file_name=req.file_name,
            mime_type=req.mime_type,
            patient_id=patient_id
        )
        return presigned_info
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate upload URL: {str(e)}")


@router.post("/confirm", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
def confirm_document_upload(
    record_in: MedicalRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Persist document metadata after successful client-side upload to S3.
    """
    record = MedicalRecord(
        patient_id=record_in.patient_id,
        uploaded_by_id=current_user.id,
        title=record_in.title,
        description=record_in.description,
        category=record_in.category,
        file_key=record_in.file_key,
        file_name=record_in.file_name,
        file_size_bytes=record_in.file_size_bytes,
        mime_type=record_in.mime_type,
        s3_bucket=settings.S3_BUCKET_NAME,
        checksum_sha256=record_in.checksum_sha256,
        is_archived=False
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="UPLOAD_MEDICAL_RECORD",
        resource_type="MedicalRecord",
        resource_id=str(record.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"file_name": record.file_name, "category": record.category.value, "patient_id": record.patient_id}
    )

    return record


@router.get("/", response_model=PaginatedResponse[MedicalRecordResponse])
def list_medical_records(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    patient_id: Optional[int] = None,
    category: Optional[DocumentCategory] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List medical records with RBAC scoping and category filter."""
    query = db.query(MedicalRecord).filter(MedicalRecord.is_archived == False)

    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient:
            return {"items": [], "total": 0, "page": page, "size": size, "total_pages": 0}
        query = query.filter(MedicalRecord.patient_id == patient.id)
    elif patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)

    if category:
        query = query.filter(MedicalRecord.category == category)

    total = query.count()
    items = query.order_by(MedicalRecord.created_at.desc()).offset((page - 1) * size).limit(size).all()
    total_pages = (total + size - 1) // size

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": total_pages
    }


@router.get("/{record_id}/download-url", response_model=PresignedDownloadResponse)
def get_download_url(
    record_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a time-limited S3 presigned download URL for a medical document.
    Enforces HIPAA audit logging for every access.
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical document not found")

    # Access control
    if current_user.role == UserRole.PATIENT:
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    download_info = storage_service.generate_presigned_download_url(
        file_key=record.file_key,
        file_name=record.file_name
    )
    download_info["mime_type"] = record.mime_type

    client_info = extract_client_info(request)
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role.value,
        action="DOWNLOAD_MEDICAL_RECORD",
        resource_type="MedicalRecord",
        resource_id=str(record.id),
        ip_address=client_info["ip_address"],
        user_agent=client_info["user_agent"],
        details={"file_name": record.file_name, "category": record.category.value}
    )

    return download_info


# ==========================================
# Local Development Fallback Endpoints
# ==========================================
@router.put("/local-upload")
async def local_upload_handler(
    request: Request,
    file_key: str = Query(...)
):
    """Handles direct file upload for local development mode."""
    target_path = os.path.join(settings.LOCAL_UPLOAD_DIR, file_key.replace("/", "_"))
    os.makedirs(os.path.dirname(target_path) or ".", exist_ok=True)
    
    body = await request.body()
    with open(target_path, "wb") as f:
        f.write(body)

    return {"status": "success", "file_key": file_key}


@router.get("/local-download")
def local_download_handler(
    file_key: str = Query(...)
):
    """Serves file directly in local development mode."""
    target_path = os.path.join(settings.LOCAL_UPLOAD_DIR, file_key.replace("/", "_"))
    if not os.path.exists(target_path):
        # Create a dummy sample content if file doesn't exist on disk yet
        os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)
        with open(target_path, "wb") as f:
            f.write(b"%PDF-1.4\n%CareFlow Sample Clinical Diagnostic Report\n1 0 obj\n<< /Title (Medical Record) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")

    return FileResponse(target_path, filename=os.path.basename(file_key))
