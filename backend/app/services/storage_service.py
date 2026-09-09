import io
import json
import uuid
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.core.config import settings

THUMBNAIL_MAX_SIZE = (300, 300)
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
OUTPUT_FORMAT = "WEBP"
OUTPUT_CONTENT_TYPE = "image/webp"
OUTPUT_EXTENSION = "webp"


@dataclass(frozen=True)
class UploadedImage:
    filename: str
    image_url: str


class StorageService:
    def __init__(self) -> None:
        self.bucket = settings.MINIO_BUCKET
        self.public_base_url = settings.AWS_S3_PUBLIC_URL.rstrip("/")
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

        self._ensure_public_read_policy()

    def _ensure_public_read_policy(self) -> None:
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.bucket}/*"],
                }
            ],
        }
        try:
            self.client.put_bucket_policy(Bucket=self.bucket, Policy=json.dumps(policy))
        except ClientError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to configure media bucket access.",
            ) from exc

    def build_public_url(self, filename: str) -> str:
        key = filename.lstrip("/")
        return f"{self.public_base_url}/{self.bucket}/{key}"

    def get_public_url(self, filename: str) -> str:
        if not filename or filename.strip() != filename or ".." in filename.split("/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename.",
            )
        return self.build_public_url(filename)

    def upload_image(self, file: UploadFile) -> UploadedImage:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A file is required.",
            )

        content_type = (file.content_type or "").lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPEG, PNG, WebP, or GIF images are allowed.",
            )

        self.ensure_bucket_exists()

        try:
            thumbnail_bytes = self._create_thumbnail(file)
        except UnidentifiedImageError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a valid image.",
            ) from exc
        except OSError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to process image.",
            ) from exc

        filename = f"uploads/{uuid.uuid4()}.{OUTPUT_EXTENSION}"

        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=filename,
                Body=thumbnail_bytes,
                ContentType=OUTPUT_CONTENT_TYPE,
            )
        except ClientError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload image.",
            ) from exc

        return UploadedImage(filename=filename, image_url=self.build_public_url(filename))

    def _create_thumbnail(self, file: UploadFile) -> bytes:
        raw = file.file.read()
        if not raw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        with Image.open(io.BytesIO(raw)) as image:
            image = image.convert("RGB")
            image.thumbnail(THUMBNAIL_MAX_SIZE, Image.Resampling.LANCZOS)

            buffer = io.BytesIO()
            image.save(buffer, format=OUTPUT_FORMAT, quality=85, method=6)
            return buffer.getvalue()
