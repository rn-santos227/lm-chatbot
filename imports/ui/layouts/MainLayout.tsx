import React, { useEffect, useRef, useState } from "react";
import { ChatSession } from "../types/session";
import { formatChatHtml } from "../utils/formatter";

import { UploadFileButton } from "../components/UploadFileButton";
import { FileComponent } from "../components/FileComponent";
import type { UploadedFile } from "../types/file";

interface MainLayoutProps {
  userName: string;
  activeChat: ChatSession | null;
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onAnalyzeFile: (file: UploadedFile) => void;
  isProcessing: boolean;
  isHistoryLoading: boolean;
  canLoadMoreHistory: boolean;
  onLoadOlderMessages: () => void;
  isLocked: boolean;
  onRetryConnection: () => void;
  isCheckingConnection: boolean;
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
  onAnalyzeFile,
  isProcessing,
  isHistoryLoading,
  canLoadMoreHistory,
  onLoadOlderMessages,
  isLocked,
  onRetryConnection,
  isCheckingConnection,
}) => {
  const disableSend = !messageInput.trim() || !activeChat || isLocked;
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [activeChat?.id, activeChat?.messages.length, isProcessing]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disableSend) {
        onSendMessage();
      }
    }
  };

  const handleUploadComplete = (file: UploadedFile) => {
    setUploadedFiles((current) => [file, ...current]);
    if (isLocked) return;

    onAnalyzeFile(file);
  };

  return (
    <main className="flex-1 flex flex-col bg-gray-100 text-gray-900 min-h-screen">
      <header className="p-4 border-b bg-white flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {activeChat?.title || "No chat selected"}
          </p>
          <h1 className="text-2xl font-semibold">Assistant Chat</h1>

          {isLocked && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
              <span>LM Studio connection required to chat.</span>
              <button
                type="button"
                onClick={onRetryConnection}
                disabled={isCheckingConnection}
                className="text-red-800 font-semibold underline disabled:opacity-60"
              >
                {isCheckingConnection ? "Checking..." : "Retry"}
              </button>
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">User</p>
          <p className="text-lg font-semibold">{userName || "Unnamed"}</p>
        </div>
      </header>

      <section
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50"
      >
        {canLoadMoreHistory && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLoadOlderMessages}
              disabled={isHistoryLoading || isLocked}
              className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100 disabled:opacity-60"
            >
              {isHistoryLoading ? "Loading history..." : "Load older messages"}
            </button>
          </div>
        )}

        {activeChat?.messages.map((message: ChatSession['messages'][number]) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-3xl rounded-2xl px-4 py-3 shadow text-sm leading-relaxed border message-bubble ${
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

              <div
                className="chat-content whitespace-pre-wrap"
                dangerouslySetInnerHTML={formatChatHtml(message.content)}
              />
            </div>
          </div>
        ))}

        {uploadedFiles.map((file) => (
          <FileComponent key={file._id} file={file} align="right" />
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-2xl px-4 py-3 shadow text-sm leading-relaxed border bg-white text-gray-900 border-gray-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" aria-hidden />
              <span>LM Studio is processing your request...</span>
            </div>
          </div>
        )}
      </section>

      <footer className="bg-white border-t p-4">
        <div className="flex gap-3">
          <textarea
            value={messageInput}
            onKeyDown={handleKeyDown}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Send a message to the assistant..."
            disabled={isLocked}
          />

          <UploadFileButton
            onUploadComplete={handleUploadComplete}
            onUploadError={(message) =>
              console.error("Upload failed in MainLayout", message)
            }
            disabled={isProcessing}
            label="Upload file"
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
