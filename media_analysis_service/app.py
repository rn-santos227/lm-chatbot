from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.audio_analyzer import analyze_voice
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

class AudioRequest(BaseModel):
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

class AudioResponse(BaseModel):
    text: str
    duration_seconds: float = Field(alias="durationSeconds")
    rms_amplitude: float = Field(alias="rmsAmplitude")
    sample_rate: int = Field(alias="sampleRate")
    bucket: str
    key: str

    model_config = ConfigDict(populate_by_name=True)

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

@app.post("/transcribe", response_model=AudioResponse)
def transcribe_audio(req: AudioRequest):
    try:
        audio_bytes = fetch_file(req.bucket, req.key)
        summary, duration, rms, sample_rate = analyze_voice(
            audio_bytes, req.mime_type
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audio processing failed",
        ) from exc

    return AudioResponse(
        text=summary,
        duration_seconds=duration,
        rms_amplitude=rms,
        sample_rate=sample_rate,
        bucket=req.bucket,
        key=req.key,
    )
