from io import BytesIO
from typing import Final

from PIL import Image

MAX_FILE_SIZE_BYTES: Final[int] = 20 * 1024 * 1024
MAX_IMAGE_PIXELS: Final[int] = 50_000_000
SUPPORTED_IMAGE_MIME_TOKENS: Final[tuple[str, ...]] = ("jpeg", "jpg", "png", "bmp", "tiff")


def normalize_mime_type(mime_type: str) -> str:
    return mime_type.strip().lower()


def _guard_empty_and_size(file_bytes: bytes) -> None:
    if not file_bytes:
        raise ValueError("Uploaded file is empty")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError("Uploaded file is too large for OCR processing")


def _sanitize_image(file_bytes: bytes) -> None:
    try:
        with Image.open(BytesIO(file_bytes)) as img:
            img.verify()
            width, height = img.size
    except Exception as exc:
        raise ValueError("Invalid or corrupted image content") from exc

    if width * height > MAX_IMAGE_PIXELS:
        raise ValueError("Image dimensions exceed allowed limits")


def _sanitize_pdf(file_bytes: bytes) -> None:
    if not file_bytes.startswith(b"%PDF"):
        raise ValueError("File content does not appear to be a valid PDF")


def sanitize_file(file_bytes: bytes, mime_type: str) -> bytes:
    """Validate and lightly sanitize user-uploaded bytes before OCR."""

    _guard_empty_and_size(file_bytes)

    if is_pdf_mime(mime_type):
        _sanitize_pdf(file_bytes)
        return file_bytes

    if is_image_mime(mime_type):
        _sanitize_image(file_bytes)
        return file_bytes

    raise ValueError(f"Unsupported MIME type for OCR: {mime_type}")


def is_pdf_mime(mime_type: str) -> bool:
    return "pdf" in mime_type


def is_image_mime(mime_type: str) -> bool:
    return any(token in mime_type for token in SUPPORTED_IMAGE_MIME_TOKENS)
