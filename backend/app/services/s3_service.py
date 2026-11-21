import os
import uuid
from typing import Dict, Any, Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings

# Allowed medical document content types
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/dicom",
    "text/plain",
}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB max


class S3StorageService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.expiration = settings.S3_PRESIGNED_EXPIRATION
        self.is_s3_enabled = settings.STORAGE_MODE == "s3"

        if self.is_s3_enabled:
            self.s3_client = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                config=Config(signature_version="s3v4")
            )
        else:
            self.s3_client = None
            # Ensure local upload dir exists
            os.makedirs(settings.LOCAL_UPLOAD_DIR, exist_ok=True)

    def generate_presigned_upload_url(
        self,
        file_name: str,
        mime_type: str,
        patient_id: int
    ) -> Dict[str, Any]:
        """
        Generate a presigned PUT URL for direct client-to-S3 secure uploads.
        Ensures PHI documents are encrypted at rest with KMS.
        """
        if mime_type not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Unsupported document MIME type: {mime_type}")

        unique_id = uuid.uuid4().hex
        clean_filename = file_name.replace(" ", "_")
        file_key = f"patients/{patient_id}/records/{unique_id}_{clean_filename}"

        if self.is_s3_enabled and self.s3_client:
            try:
                url = self.s3_client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": file_key,
                        "ContentType": mime_type,
                        "ServerSideEncryption": "aws:kms"
                    },
                    ExpiresIn=self.expiration
                )
                return {
                    "upload_url": url,
                    "file_key": file_key,
                    "expires_in_seconds": self.expiration
                }
            except ClientError as e:
                raise RuntimeError(f"AWS S3 error generating presigned upload URL: {str(e)}")
        else:
            # Local development simulation endpoint
            local_upload_url = f"{settings.API_V1_STR}/medical-records/local-upload?file_key={file_key}"
            return {
                "upload_url": local_upload_url,
                "file_key": file_key,
                "expires_in_seconds": self.expiration
            }

    def generate_presigned_download_url(
        self,
        file_key: str,
        file_name: str
    ) -> Dict[str, Any]:
        """Generate a time-limited presigned GET URL for secure document viewing."""
        if self.is_s3_enabled and self.s3_client:
            try:
                url = self.s3_client.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": file_key,
                        "ResponseContentDisposition": f'inline; filename="{file_name}"'
                    },
                    ExpiresIn=self.expiration
                )
                return {
                    "download_url": url,
                    "file_name": file_name,
                    "expires_in_seconds": self.expiration
                }
            except ClientError as e:
                raise RuntimeError(f"AWS S3 error generating presigned download URL: {str(e)}")
        else:
            # Local development download URL
            local_download_url = f"{settings.API_V1_STR}/medical-records/local-download?file_key={file_key}"
            return {
                "download_url": local_download_url,
                "file_name": file_name,
                "expires_in_seconds": self.expiration
            }


storage_service = S3StorageService()
