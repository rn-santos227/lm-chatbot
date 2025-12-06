from fastapi import FastAPI
from pydantic import BaseModel
from minio_client import fetch_file
from ocr_engine import run_ocr

app = FastAPI()

class OCRRequest(BaseModel):
    bucket: str
    key: str
    mime_type: str

class OCRResponse(BaseModel):
    text: str
    bucket: str
    key: str

@app.post("/ocr", response_model=OCRResponse)
def do_ocr(req: OCRRequest):
    # Download from MinIO
    file_bytes = fetch_file(req.bucket, req.key)

    # Perform OCR
    text = run_ocr(file_bytes, req.mime_type)

    return OCRResponse(
        text=text,
        bucket=req.bucket,
        key=req.key,
    )
