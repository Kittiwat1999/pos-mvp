import uuid
from typing import Any

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.file_asset import FileAsset


class StorageService:
    def __init__(self, db: Session):
        self.db = db
        self.bucket = settings.MINIO_BUCKET
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name=settings.MINIO_REGION,
        )

    def ensure_bucket_exists(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket)

    def upload_file(self, file: UploadFile) -> FileAsset:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A file is required.",
            )

        self.ensure_bucket_exists()

        file_bytes = file.file.read()
        file_key = f"uploads/{uuid.uuid4()}-{file.filename}"

        self.client.put_object(
            Bucket=self.bucket,
            Key=file_key,
            Body=file_bytes,
            ContentType=file.content_type or "application/octet-stream",
        )

        asset = FileAsset(
            filename=file.filename,
            object_key=file_key,
            bucket=self.bucket,
            content_type=file.content_type or "application/octet-stream",
            size_bytes=len(file_bytes),
        )

        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return asset

    def get_file(self, file_id: int) -> FileAsset:
        asset = self.db.get(FileAsset, file_id)
        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found.",
            )
        return asset

    def get_signed_url(self, file_id: int) -> str:
        asset = self.get_file(file_id)
        try:
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": asset.bucket, "Key": asset.object_key},
                ExpiresIn=3600,
            )
        except ClientError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate file URL.",
            ) from exc

    def serialize_asset(self, asset: FileAsset) -> dict[str, Any]:
        return {
            "id": asset.id,
            "filename": asset.filename,
            "object_key": asset.object_key,
            "bucket": asset.bucket,
            "content_type": asset.content_type,
            "size_bytes": asset.size_bytes,
            "created_at": asset.created_at.isoformat() if asset.created_at else None,
        }
