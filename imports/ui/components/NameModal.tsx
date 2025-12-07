import React from "react";

interface NameModalProps {
  isOpen: boolean;
  pendingName: string;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  pendingName,
  onChangeName,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 space-y-4">
          <h2 className="text-xl font-semibold">Welcome!</h2>

          <p className="text-sm text-gray-600">
            Please tell us your name so we can personalize your conversations.
          </p>

          <input
            value={pendingName}
            onChange={(e) => onChangeName(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter your name"
          />

          <div className="flex justify-end gap-3">
            <button className="text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>
              Close
            </button>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              onClick={onSave}
              disabled={!pendingName.trim()}
            >
              Save Name
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
