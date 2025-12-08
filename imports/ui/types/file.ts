import type { FileDoc } from "/imports/api/files/file.types";

export type UploadedFile = FileDoc & { 
  _id: string;
  instruction?: string;
  sent?: boolean;
};

export type Attachment = {
  id: string;
  file: File;
  uploaded?: UploadedFile;
  instruction?: string;
  sent?: boolean;
  error?: string;
};
