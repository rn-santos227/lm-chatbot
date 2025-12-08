import React, { useEffect, useRef, useState } from "react";
import { ChatSession } from "../types/session";
import { formatChatHtml } from "../utils/formatter";

import { UploadFileButton } from "../components/UploadFileButton";
import { FileComponent } from "../components/FileComponent";
import type { UploadedFile, Attachment } from "../types/file";
import { createId } from "../hooks/chatSessionHelpers";

interface MainLayoutProps {
  userName: string;
  activeChat: ChatSession | null;
  messageInput: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onAnalyzeFile: (file: UploadedFile, command?: string) => void;
  isProcessing: boolean;
  processingStatus?: string | null;
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
  processingStatus,
  isHistoryLoading,
  canLoadMoreHistory,
  onLoadOlderMessages,
  isLocked,
  onRetryConnection,
  isCheckingConnection,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const pendingAttachments = attachments.filter((file) => !file.sent);
  const disableSend =
    isUploadingAttachments ||
    (!messageInput.trim() && pendingAttachments.length === 0) ||
    !activeChat ||
    isLocked;
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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
        void handleSend();
      }
    }
  };

  const handleFileSelected = (file: File) => {
    setAttachments((current) => [
      {
        id: createId(),
        file,
        sent: false,
      },
      ...current,
    ]);
  };

  const uploadFile = async (file: File) => {
    const response = await fetch("/upload", {
      method: "POST",
      headers: {
        "x-file-name": file.name,
        "x-file-type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      url: string;
      bucket: string;
      key: string;
      contentType: string;
      fileId: string;
      size: number;
      originalName?: string;
    };

    const uploadedFile: UploadedFile = {
      _id: payload.fileId,
      url: payload.url,
      bucket: payload.bucket,
      key: payload.key,
      contentType: payload.contentType,
      size: payload.size,
      originalName: payload.originalName,
      createdAt: new Date(),
    };

    return uploadedFile;
  };

  const handleSend = async () => {
    if (disableSend) return;

    const trimmedCommand = messageInput.trim();
    const hasMessage = trimmedCommand.length > 0;
    const filesToSend = pendingAttachments;

    if (hasMessage && filesToSend.length === 0) {
      onSendMessage();
    } else {
      onMessageChange("");
    }

    if (filesToSend.length > 0) {
      setIsUploadingAttachments(true);
      let allUploadsSucceeded = true;

      for (const attachment of filesToSend) {
        setAttachments((current) =>
          current.map((item) =>
            item.id === attachment.id
              ? {
                  ...item,
                  instruction: trimmedCommand || undefined,
                  error: undefined,
                }
              : item
          )
        );

        try {
          const uploaded = await uploadFile(attachment.file);
          const fileWithInstruction: UploadedFile = {
            ...uploaded,
            instruction: trimmedCommand || undefined,
          };

          onAnalyzeFile(fileWithInstruction, trimmedCommand);

          setAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    uploaded,
                    instruction: trimmedCommand || undefined,
                    sent: true,
                    error: undefined,
                  }
                : item
            )
          );
        } catch (error) {
          console.error("Upload failed", error);
          allUploadsSucceeded = false;
          setAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    error:
                      error instanceof Error
                        ? error.message
                        : "Unable to upload file",
                  }
                : item
            )
          );
        }
      }

      setIsUploadingAttachments(false);

      if (allUploadsSucceeded) {
        setAttachments([]);
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachments((current) => current.filter((file) => file.id !== fileId));
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

        {activeChat?.messages.map((message: ChatSession['messages'][number]) => {
          const isUser = message.sender === "user";
          const visibleText = message.displayText ?? message.content;

          return (
            <div key={message.id} className="space-y-2">
              {visibleText && (
                <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-3xl rounded-2xl px-4 py-3 shadow text-sm leading-relaxed border message-bubble ${
                      isUser
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-900 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {isUser ? userName || "User" : "Assistant"}
                      </span>

                      <span className="text-[10px] opacity-70">
                        {formattedTimestamp(message.timestamp)}
                      </span>
                    </div>

                    <div
                      className="chat-content whitespace-pre-wrap"
                      dangerouslySetInnerHTML={formatChatHtml(visibleText)}
                    />
                  </div>
                </div>
              )}

              {message.attachments?.map((file, index) => (
                <FileComponent
                  key={`${message.id}-${file._id || file.key || index}`}
                  file={{ ...file, sent: true }}
                  align={isUser ? "right" : "left"}
                />
              ))}
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-2xl px-4 py-3 shadow text-sm leading-relaxed border bg-white text-gray-900 border-gray-200 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" aria-hidden />
              <div className="space-y-0.5">
                <p className="font-semibold">Assistant in progress</p>
                <p className="text-xs text-gray-700">
                  {processingStatus || "LM Studio is processing your request..."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <footer className="bg-white border-t p-4">
        <div className="flex flex-col gap-3">
          {attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-600">Attached files</p>
              <div className="flex flex-wrap gap-3">
                {attachments.map((attachment) => {
                  const displayName =
                    attachment.uploaded?.originalName ||
                    attachment.uploaded?.key ||
                    attachment.file.name;
                  const displayType =
                    attachment.uploaded?.contentType ||
                    attachment.file.type ||
                    "Unknown file type";
                  const status = attachment.error
                    ? attachment.error
                    : attachment.sent
                      ? "Sent"
                      : isUploadingAttachments
                        ? "Uploading..."
                        : "Pending send";

                  return (
                    <div
                      key={attachment.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm max-w-xl"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-gray-600">{displayType}</p>
                        {status && (
                          <p
                            className={`mt-1 text-[11px] font-semibold uppercase ${
                              attachment.error
                                ? "text-red-700"
                                : attachment.sent
                                  ? "text-green-700"
                                  : "text-gray-700"
                            }`}
                          >
                            {status}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(attachment.id)}
                        className="text-xs font-semibold text-gray-600 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <textarea
              value={messageInput}
              onKeyDown={handleKeyDown}
              onChange={(e) => onMessageChange(e.target.value)}
              className="flex-1 h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Send a message to the assistant..."
              disabled={isLocked}
            />

            <div className="flex flex-row gap-2">
              <div className="flex gap-2 justify-end">
                <UploadFileButton
                  onFileSelected={handleFileSelected}
                  onUploadError={(message) =>
                    console.error("Upload failed in MainLayout", message)
                  }
                  disabled={isProcessing || isLocked}
                  existingFiles={attachments.map((file) => ({
                    name: file.file.name,
                    size: file.file.size,
                  }))}
                  label="Upload file"
                />

                <button
                  onClick={handleSend}
                  disabled={disableSend}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};
