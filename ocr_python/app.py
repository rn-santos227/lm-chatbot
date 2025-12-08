from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, field_validator

from src.minio_client import fetch_file
from src.ocr_engine import run_ocr
from src.sanitizer import normalize_mime_type, sanitize_file

app = FastAPI()

class OCRRequest(BaseModel):
    bucket: str
    key: str
    mime_type: str

    @field_validator("bucket", "key", "mime_type")
    @classmethod
    def not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError(f"{value!r} is not a valid non-empty value")
        return cleaned


class OCRResponse(BaseModel):
    text: str
    bucket: str
    key: str

@app.post("/ocr", response_model=OCRResponse)
def do_ocr(req: OCRRequest):
    try:
        normalized_mime = normalize_mime_type(req.mime_type)
        file_bytes = fetch_file(req.bucket, req.key)
        sanitized_bytes = sanitize_file(file_bytes, normalized_mime)
        text = run_ocr(sanitized_bytes, normalized_mime)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR processing failed",
        ) from exc

    return OCRResponse(
        text=text,
        bucket=req.bucket,
        key=req.key,
    )
