import type { FileDoc } from "/imports/api/files/file.types";

export type UploadedFile = FileDoc & { 
  _id: string;
  instruction?: string;
  sent?: boolean;
};
