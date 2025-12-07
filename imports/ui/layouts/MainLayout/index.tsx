import React from "react";
import { ChatSession } from "../../types/session";
import "./index.css";

interface MainLayoutProps {
  userName: string;
  activeChat: ChatSession | null;
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

const formattedTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  userName,
  activeChat,
  messageInput,
  onMessageChange,
  onSendMessage,
}) => {
  const disableSend = !messageInput.trim() || !activeChat;

  return (
    <main className="main-layout">
      <header className="main-header">
        <div>
          <p className="main-subtitle">{activeChat?.title || "No chat selected"}</p>
          <h1 className="main-title">Assistant Chat</h1>
        </div>
        <div className="main-user">
          <p className="main-user-label">User</p>
          <p className="main-user-name">{userName || "Unnamed"}</p>
        </div>
      </header>

      <section className="main-messages">
        {activeChat?.messages.map((message: typeof activeChat.messages[number]) => (
          <div
            key={message.id}
            className={`message-row ${message.sender === "user" ? "message-row--user" : "message-row--assistant"}`}
          >
            <div
              className={`message-card ${
                message.sender === "user" ? "message-card--user" : "message-card--assistant"
              }`}
            >
              <div className="message-meta">
                <span className="message-author">
                  {message.sender === "user" ? userName || "User" : "Assistant"}
                </span>
                <span className="message-timestamp">{formattedTimestamp(message.timestamp)}</span>
              </div>
              <p className="message-body">{message.content}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="main-footer">
        <div className="main-input">
          <textarea
            value={messageInput}
            onChange={(e) => onMessageChange(e.target.value)}
            className="main-textarea"
            placeholder="Send a message to the assistant..."
          />
          <button
            onClick={onSendMessage}
            className="main-send"
            disabled={disableSend}
          >
            Send
          </button>
        </div>
      </footer>
    </main>
  );
};
