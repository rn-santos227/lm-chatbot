import React, { useRef, useState } from "react";
import type { UploadedFile } from "../types/file";

interface UploadFileButtonProps {
  onUploadComplete: (file: UploadedFile) => void;
  onUploadError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
}

export const UploadFileButton: React.FC<UploadFileButtonProps> = ({
  onUploadComplete,
  onUploadError,
  disabled,
  label = "Upload",
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await fetch("/upload", {
        method: "POST",
        headers: {
          "x-file-name": file.name,
          "x-file-type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const payload = (await response.json()) as {
        url: string;
        bucket: string;
        key: string;
        contentType: string;
        fileId: string;
        size: number;
        originalName?: string;
      };

      const uploadedFile: UploadedFile = {
        _id: payload.fileId,
        url: payload.url,
        bucket: payload.bucket,
        key: payload.key,
        contentType: payload.contentType,
        size: payload.size,
        originalName: payload.originalName,
        createdAt: new Date(),
      };

      onUploadComplete(uploadedFile);
    } catch (error) {
      console.error("Upload failed", error);
      const message =
        error instanceof Error ? error.message : "Unable to upload file";
      onUploadError?.(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {isUploading ? "Uploading..." : label}
      </button>
    </div>
  );
};
