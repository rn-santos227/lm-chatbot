from collections import defaultdict
from io import BytesIO
from statistics import mean
from typing import Dict, List, Tuple
from xml.etree import ElementTree
from zipfile import BadZipFile, ZipFile
from pypdf import PdfReader

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image, ImageOps

from src.sanitizer import is_doc_mime, is_image_mime, is_pdf_mime, is_text_mime

def _preprocess_image(data: bytes) -> Image.Image:
    image = Image.open(BytesIO(data))

    if image.mode == "RGBA":
        image = image.convert("RGB")

    grayscale = ImageOps.grayscale(image)
    contrasted = ImageOps.autocontrast(grayscale)
    binary = contrasted.point(lambda x: 0 if x < 128 else 255, mode="1")
    return binary

def _extract_text(img: Image.Image) -> str:
    return pytesseract.image_to_string(img, config="--psm 6")

def _extract_table_rows(img: Image.Image) -> List[List[str]]:
    data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

    words = []
    for i, text in enumerate(data["text"]):
        cleaned = text.strip()
        if not cleaned:
            continue
        words.append(
            {
                "text": cleaned,
                "left": data["left"][i],
                "top": data["top"][i],
                "block": data["block_num"][i],
                "par": data["par_num"][i],
                "line": data["line_num"][i],
            }
        )

    if not words:
        return []

    lines: Dict[Tuple[int, int, int], List[Dict[str, int]]] = defaultdict(list)
    for word in words:
        key = (word["block"], word["par"], word["line"])
        lines[key].append(word)

    sorted_lines = sorted(
        lines.values(), key=lambda line_words: (min(w["top"] for w in line_words), min(w["left"] for w in line_words))
    )

    centers = []
    for line_words in sorted_lines:
        for word in line_words:
            centers.append(word["left"])

    if not centers:
        return []

    centers.sort()
    column_clusters: List[List[int]] = []
    threshold_px = 50

    for center in centers:
        if not column_clusters or center - column_clusters[-1][-1] > threshold_px:
            column_clusters.append([center])
        else:
            column_clusters[-1].append(center)

    column_positions = [int(mean(cluster)) for cluster in column_clusters]

    rows: List[List[str]] = []
    for line_words in sorted_lines:
        row = ["" for _ in column_positions]
        for word in sorted(line_words, key=lambda w: w["left"]):
            column_index = min(
                range(len(column_positions)),
                key=lambda idx: abs(column_positions[idx] - word["left"]),
            )

            row[column_index] = (row[column_index] + " " + word["text"]).strip()

        rows.append(row)

    unique_non_empty_columns = {idx for row in rows for idx, value in enumerate(row) if value}
    if len(unique_non_empty_columns) <= 1:
        return []

    return rows

def _format_table_rows_as_markdown(rows: List[List[str]]) -> str:
    if not rows:
        return ""

    column_count = max(len(row) for row in rows)
    normalized_rows = [row + [""] * (column_count - len(row)) for row in rows]

    header = normalized_rows[0]
    separator = ["---"] * column_count
    body = normalized_rows[1:] if len(normalized_rows) > 1 else []

    table_lines = [f"| {' | '.join(header)} |", f"| {' | '.join(separator)} |"]
    for row in body:
        table_lines.append(f"| {' | '.join(row)} |")

    return "\n".join(table_lines)

def ocr_image(data: bytes) -> str:
    img = _preprocess_image(data)
    text = _extract_text(img)

    table_rows = _extract_table_rows(img)
    table_text = _format_table_rows_as_markdown(table_rows)

    if table_text:
        return f"{text}\n\nExtracted tables:\n{table_text}"

    return text

def _ocr_pdf_images(data: bytes) -> str:
    pages = convert_from_bytes(data, dpi=300)
    text_blocks = []

    for page in pages:
        buffer = BytesIO()
        page.save(buffer, format="PNG")
        page_bytes = buffer.getvalue()
        text_blocks.append(ocr_image(page_bytes))

    return "\n\n".join(text_blocks)

def _extract_pdf_metadata(reader: PdfReader) -> str:
    if not reader.metadata:
        return ""

    metadata_lines = []
    for key, value in sorted(reader.metadata.items(), key=lambda item: item[0]):
        if value is None:
            continue
        cleaned_key = key.lstrip("/")
        metadata_lines.append(f"{cleaned_key}: {value}")

    return "\n".join(metadata_lines)

def _extract_pdf_text(reader: PdfReader) -> str:
    text_blocks: list[str] = []

    for index, page in enumerate(reader.pages, start=1):
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        cleaned = page_text.strip()
        if cleaned:
            text_blocks.append(f"Page {index}:\n{cleaned}")

    return "\n\n".join(text_blocks)

def _open_pdf_reader(data: bytes) -> PdfReader:
    try:
        reader = PdfReader(BytesIO(data))
    except Exception as exc:
        raise ValueError("Failed to parse PDF content") from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError("Encrypted PDFs are not supported") from exc

    return reader

def _combine_pdf_sections(metadata: str, content: str) -> str:
    sections = []

    if metadata:
        sections.append(f"Metadata:\n{metadata}")

    if content:
        sections.append(content)

    return "\n\n".join(sections) if sections else ""

def ocr_pdf(data: bytes) -> str:
    reader = _open_pdf_reader(data)
    metadata = _extract_pdf_metadata(reader)
    extracted_text = _extract_pdf_text(reader)

    if extracted_text:
        return _combine_pdf_sections(metadata, extracted_text)

    image_text = _ocr_pdf_images(data)
    return _combine_pdf_sections(metadata, image_text)

def _extract_plain_text(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")

def _extract_docx(file_bytes: bytes) -> str:
    try:
        with ZipFile(BytesIO(file_bytes)) as archive:
            with archive.open("word/document.xml") as document_xml:
                xml_content = document_xml.read()
    except (KeyError, BadZipFile) as exc:
        raise ValueError("Invalid DOCX content") from exc

    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    root = ElementTree.fromstring(xml_content)

    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", namespace):
        texts = [node.text for node in paragraph.findall(".//w:t", namespace) if node.text]
        if texts:
            paragraphs.append("".join(texts))

    return "\n\n".join(paragraphs)

def run_ocr(file_bytes: bytes, mime_type: str) -> str:
    if is_text_mime(mime_type):
        return _extract_plain_text(file_bytes)

    if is_doc_mime(mime_type):
        return _extract_docx(file_bytes)

    if is_pdf_mime(mime_type):
        return ocr_pdf(file_bytes)

    if is_image_mime(mime_type):
        return ocr_image(file_bytes)

    raise ValueError(f"Unsupported MIME type for OCR: {mime_type}")
