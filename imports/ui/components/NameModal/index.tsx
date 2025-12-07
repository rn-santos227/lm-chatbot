import React from "react";
import "./index.css";

interface NameModalProps {
  isOpen: boolean;
  pendingName: string;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const NameModal = ({
  isOpen,
  pendingName,
  onChangeName,
  onClose,
  onSave,
}: NameModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="name-modal-overlay">
      <div className="name-modal-card">
        <h2 className="name-modal-title">Welcome!</h2>
        <p className="name-modal-description">
          Please tell us your name so we can personalize your conversations.
        </p>

        <input
          value={pendingName}
          onChange={(e) => onChangeName(e.target.value)}
          className="name-modal-input"
          placeholder="Enter your name"
        />

        <div className="name-modal-actions">
          <button className="name-modal-cancel" onClick={onClose}>
            Close
          </button>

          <button
            className="name-modal-save"
            onClick={onSave}
            disabled={!pendingName.trim()}
          >
            Save Name
          </button>
        </div>
      </div>
    </div>
  );
};

export default NameModal;
