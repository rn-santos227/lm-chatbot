import React from "react";

import type { UploadedFile } from "../types/file";

const isImage = (contentType: string) => contentType.startsWith("image/");

const isDocument = (contentType: string) =>
  contentType.includes("pdf") ||
  contentType.includes("msword") ||
  contentType.includes("officedocument") ||
  contentType.startsWith("text/");

const isAudio = (contentType: string) => contentType.startsWith("audio/");

interface FileComponentProps {
  file: UploadedFile;
  align?: "left" | "right";
}

export const FileComponent: React.FC<FileComponentProps> = ({
  file,
  align = "right",
}) => {
  const isSent = align === "right";
  const bubbleColors = isSent
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-white text-gray-900 border-gray-200";
  const metadataTone = isSent ? "text-blue-100" : "text-gray-500";
  const linkTone = isSent
    ? "text-white underline decoration-white/70 hover:decoration-white"
    : "text-blue-600 hover:underline";

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs sm:max-w-md rounded-2xl overflow-hidden border shadow message-bubble ${bubbleColors}`}
      >
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {file.originalName || file.key}
              </p>
              <p className={`text-[11px] ${metadataTone}`}>{file.contentType}</p>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              download
              className={`text-xs font-semibold flex-shrink-0 ${linkTone}`}
            >
              Download
            </a>
          </div>

          {file.instruction && (
            <div
              className={`text-xs rounded-lg px-3 py-2 border ${
                isSent
                  ? "border-white/20 bg-white/10 text-blue-50"
                  : "border-gray-200 bg-gray-50 text-gray-700"
              }`}
            >
              <p className="font-semibold mb-1">Command</p>
              <p className="leading-snug whitespace-pre-wrap">{file.instruction}</p>
            </div>
          )}

          <div
            className={`rounded-xl overflow-hidden border ${
              isSent ? "border-white/20 bg-white/10" : "border-gray-200 bg-white"
            }`}
          >
            {isImage(file.contentType) ? (
              <img
                src={file.url}
                alt={file.originalName || "Uploaded file"}
                className="max-h-64 w-full object-cover"
              />
            ) : isAudio(file.contentType) ? (
              <audio
                controls
                src={file.url}
                className="w-full"
                aria-label={`Audio attachment ${file.originalName || "file"}`}
              />
            ) : isDocument(file.contentType) ? (
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className={`block px-3 py-2 text-sm font-medium ${linkTone}`}
              >
                View document
              </a>
            ) : (
              <p className={`px-3 py-2 text-sm ${isSent ? "text-blue-50" : "text-gray-700"}`}>
                This file type is not previewable. Use the download link above
                to access it.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
