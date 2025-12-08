import React, { useRef } from "react";

interface UploadFileButtonProps {
  onFileSelected: (file: File) => void;
  onUploadError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
  existingFiles?: Array<{ name: string; size: number }>;
}

export const UploadFileButton: React.FC<UploadFileButtonProps> = ({
  onFileSelected,
  onUploadError,
  disabled,
  label = "Upload",
  existingFiles = [],
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isDuplicateFile = (file: File) => {
    return existingFiles.some((existing) => {
      return existing.name === file.name && existing.size === file.size;
    });
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isDuplicateFile(file)) {
      onUploadError?.("This file is already attached.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    onFileSelected(file);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
};
