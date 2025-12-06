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

