import React from "react";
import { ChatSession } from "../types/session";

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
    <main className="flex-1 flex flex-col bg-gray-100 text-gray-900 min-h-screen">
      {/* HEADER */}
      <header className="p-4 border-b bg-white flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {activeChat?.title || "No chat selected"}
          </p>
          <h1 className="text-2xl font-semibold">Assistant Chat</h1>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">User</p>
          <p className="text-lg font-semibold">{userName || "Unnamed"}</p>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
        {activeChat?.messages.map((message: ChatSession['messages'][number]) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-4 py-3 shadow text-sm leading-relaxed border ${
                message.sender === "user"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {message.sender === "user" ? userName || "User" : "Assistant"}
                </span>

                <span className="text-[10px] opacity-70">
                  {formattedTimestamp(message.timestamp)}
                </span>
              </div>

              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="bg-white border-t p-4">
        <div className="flex gap-3">
          <textarea
            value={messageInput}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Send a message to the assistant..."
          />

          <button
            onClick={onSendMessage}
            disabled={disableSend}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition self-end"
          >
            Send
          </button>
        </div>
      </footer>
    </main>
  );
};
