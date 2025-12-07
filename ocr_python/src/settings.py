import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_REGION = os.getenv("MINIO_REGION", "us-east-1")
    MINIO_BUCKET = os.getenv("MINIO_BUCKET", "ocr-bucket")

settings = Settings()
