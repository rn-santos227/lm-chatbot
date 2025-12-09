export interface AudioTranscriptionRequest {
  bucket: string;
  key: string;
  mime_type: string;
}

export interface AudioTranscriptionResponse {
  text?: string;
  confidence?: number;
  language?: string;
  durationSeconds?: number;
  rmsAmplitude?: number;
  sampleRate?: number;
}
