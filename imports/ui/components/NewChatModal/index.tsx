import React from "react";
import "./index.css";

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
    <div className="new-chat-modal-overlay">
      <div className="new-chat-modal-card">
        <h2 className="new-chat-modal-title">Start a new chat</h2>
        <p className="new-chat-modal-description">
          Give this conversation a name so you can quickly find it later.
        </p>
        <input
          value={chatTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="new-chat-modal-input"
          placeholder="e.g. Product questions"
        />
        <div className="new-chat-modal-actions">
          <button className="new-chat-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="new-chat-modal-create" onClick={onCreate} disabled={!canCreate}>
            Create chat
          </button>
        </div>
      </div>
    </div>
  );
};
