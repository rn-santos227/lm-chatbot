from io import BytesIO

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image

from src.sanitizer import is_image_mime, is_pdf_mime

def ocr_image(data: bytes) -> str:
    img = Image.open(BytesIO(data))
    return pytesseract.image_to_string(img)

def ocr_pdf(data: bytes) -> str:
    pages = convert_from_bytes(data)
    text_blocks = []

    for page in pages:
        text = pytesseract.image_to_string(page)
        text_blocks.append(text)

    return "\n\n".join(text_blocks)

def run_ocr(file_bytes: bytes, mime_type: str) -> str:
    if is_pdf_mime(mime_type):
        return ocr_pdf(file_bytes)

    if is_image_mime(mime_type):
        return ocr_image(file_bytes)

    raise ValueError(f"Unsupported MIME type for OCR: {mime_type}")
