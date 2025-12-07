import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
}

const colorMap = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-gray-900 text-white",
};

export const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    if (!onClose) return;

    const timeout = setTimeout(onClose, 4000);
    return () => clearTimeout(timeout);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 shadow-lg rounded-lg px-4 py-3 text-sm ${
        colorMap[type]
      }`}
    >
      {message}
    </div>
  );
};
