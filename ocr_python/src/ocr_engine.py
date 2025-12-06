from io import BytesIO
from PIL import Image
import pytesseract
from pdf2image import convert_from_bytes

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
    mime_type = mime_type.lower()

    if "pdf" in mime_type:
        return ocr_pdf(file_bytes)

    if any(x in mime_type for x in ["jpeg", "jpg", "png", "bmp", "tiff"]):
        return ocr_image(file_bytes)

    raise ValueError(f"Unsupported MIME type for OCR: {mime_type}")
