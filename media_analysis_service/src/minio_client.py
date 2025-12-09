import boto3
from src.settings import settings

s3 = boto3.client(
    "s3",
    endpoint_url=settings.MINIO_ENDPOINT,
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY,
    region_name=settings.MINIO_REGION,
)

def fetch_file(bucket: str, key: str) -> bytes:
    obj = s3.get_object(Bucket=bucket, Key=key)
    return obj["Body"].read()

def save_file(bucket: str, key: str, content_type: str, data: bytes) -> str:
    s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
    return object_url(bucket, key)

def object_url(bucket: str, key: str) -> str:
    base = settings.MINIO_PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/{bucket}/{key}"