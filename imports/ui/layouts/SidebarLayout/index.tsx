import React from "react";
import { ChatSession } from "../../types/session";
import "./index.css";

interface SidebarProps {
  userName: string;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onEditName: () => void;
}

const SidebarLayout = ({
  userName,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onEditName,
}: SidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <p className="sidebar-subtitle">Logged in as</p>
          <p className="sidebar-username">{userName || "New user"}</p>
        </div>
        <button className="sidebar-edit" onClick={onEditName}>
          Edit
        </button>
      </div>

      <div className="sidebar-action">
        <button className="sidebar-new-chat" onClick={onNewChat}>
          + New chat
        </button>
      </div>

      <div className="sidebar-list">
        <p className="sidebar-section-title">Recent</p>
        <ul className="sidebar-items">
          {chats.map((chat) => (
            <li key={chat.id}>
              <button
                onClick={() => onSelectChat(chat.id)}
                className={`sidebar-item ${
                  activeChatId === chat.id ? "sidebar-item--active" : ""
                }`}
              >
                <span className="sidebar-status" />
                <div className="sidebar-item-text">
                  <p className="sidebar-item-title">{chat.title}</p>
                  <p className="sidebar-item-preview">
                    {chat.messages[chat.messages.length - 1]?.content ||
                      "New conversation"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        Conversations are private between you and the assistant.
      </div>
    </aside>
  );
};

export default SidebarLayout;
