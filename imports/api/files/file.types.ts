export interface FileDoc {
  _id?: string;
  bucket: string;
  key: string;
  url: string;
  contentType: string;
  size: number;
  originalName?: string;
  createdAt: Date;
  uploaderId?: string;
  metadata?: Record<string, unknown>;
}
