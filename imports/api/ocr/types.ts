export interface OCRRequest {
  bucket: string;
  key: string;
  mime_type: string;
}

export interface OCRResponse {
  text: string;
  bucket: string;
  key: string;
}
