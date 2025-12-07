import React from "react";
import { ChatSession } from "../types/session";

interface SideBarProps {
  userName: string;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onEditName: () => void;
  onDeleteChat: (id: string) => void;
}

export const SideBarLayout: React.FC<SideBarProps> = ({
  userName,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onEditName,
  onDeleteChat,
}) => (
  <aside className="w-72 bg-gray-900 text-white flex flex-col">
    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase text-gray-400">Logged in as</p>
        <p className="text-lg font-semibold">{userName || "New user"}</p>
      </div>

      <button
        className="text-sm text-blue-300 hover:text-blue-200"
        onClick={onEditName}
      >
        Edit
      </button>
    </div>

    <div className="p-4 border-b border-gray-800">
      <button
        className="w-full bg-white text-gray-900 font-semibold py-2 rounded-lg shadow hover:-translate-y-0.5 transition transform"
        onClick={onNewChat}
      >
        + New chat
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      <p className="px-4 pb-2 text-xs uppercase text-gray-400">Recent</p>

      <ul className="space-y-1 px-2">
        {chats.map((chat) => (
          <li key={chat.id}>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectChat(chat.id);
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 hover:bg-gray-800 cursor-pointer ${
                activeChatId === chat.id ? "bg-gray-800" : ""
              }`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />

              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold truncate">{chat.title}</p>

                <p className="text-xs text-gray-400 truncate">
                  {chat.messages[chat.messages.length - 1]?.content ||
                    "New conversation"}
                </p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  if (activeChatId === chat.id) return;
                  onDeleteChat(chat.id);
                }}
                disabled={activeChatId === chat.id}
                aria-disabled={activeChatId === chat.id}
                className={`text-xs text-gray-400 hover:text-red-300 transition ${
                  activeChatId === chat.id
                    ? "opacity-50 cursor-not-allowed hover:text-gray-400"
                    : ""
                }`}
                aria-label={`Delete ${chat.title}`}
                title={
                  activeChatId === chat.id
                    ? "Cannot delete the active chat"
                    : `Delete ${chat.title}`
                }
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
      Conversations are private between you and the assistant.
    </div>
  </aside>
);
