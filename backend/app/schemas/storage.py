from pydantic import BaseModel, Field


class UploadedImageOut(BaseModel):
    filename: str = Field(min_length=1, max_length=500)
    image_url: str = Field(min_length=1, max_length=500)
