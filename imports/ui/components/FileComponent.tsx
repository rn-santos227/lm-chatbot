import React from "react";
import type { UploadedFile } from "../types/file";

const isImage = (contentType: string) => contentType.startsWith("image/");

const isDocument = (contentType: string) =>
  contentType.includes("pdf") ||
  contentType.includes("msword") ||
  contentType.includes("officedocument") ||
  contentType.startsWith("text/");

interface FileComponentProps {
  file: UploadedFile;
}

export const FileComponent: React.FC<FileComponentProps> = ({ file }) => {
  return (
    <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="p-3 flex items-center justify-between border-b">
        <div>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {file.originalName || file.key}
          </p>
          <p className="text-xs text-gray-500">{file.contentType}</p>
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          download
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          Download
        </a>
      </div>

      <div className="p-3">
        {isImage(file.contentType) ? (
          <img
            src={file.url}
            alt={file.originalName || "Uploaded file"}
            className="max-h-64 w-full object-contain rounded-md"
          />
        ) : isDocument(file.contentType) ? (
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View document
          </a>
        ) : (
          <p className="text-sm text-gray-700">
            This file type is not previewable. Use the download link above to
            access it.
          </p>
        )}
      </div>
    </div>
  );
};
