import React from "react";

interface NewChatModalProps {
  isOpen: boolean;
  chatTitle: string;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  chatTitle,
  onChangeTitle,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const canCreate = Boolean(chatTitle.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white rounded-2xl p-6 shadow-2xl w-96 space-y-4 modal-content">
        <h2 className="text-xl font-semibold">Start a new chat</h2>

        <p className="text-sm text-gray-600">
          Give this conversation a name so you can quickly find it later.
        </p>

        <input
          value={chatTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g. Product questions"
        />

        <div className="flex justify-end gap-3">
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            onClick={onCreate}
            disabled={!canCreate}
          >
            Create chat
          </button>
        </div>
      </div>
    </div>
  );
};
