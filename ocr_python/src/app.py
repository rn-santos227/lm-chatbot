from fastapi import FastAPI
from pydantic import BaseModel
from minio_client import fetch_file
from ocr_engine import run_ocr


