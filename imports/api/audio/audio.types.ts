export interface AudioTranscriptionRequest {
  bucket?: string;
  key?: string;
  mime_type: string;
  dataBase64?: string;
}

export interface AudioTranscriptionResponse {
  text?: string;
  confidence?: number;
  language?: string;
  durationSeconds?: number;
  rmsAmplitude?: number;
  sampleRate?: number;
  bucket?: string;
  key?: string;
  url?: string;
}