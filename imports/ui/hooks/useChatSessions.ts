import { useCallback, useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";

import { ChatSession, Message } from "../types/session";
import {
  assistantReply,
  createId,
  greetingForUser,
} from "./chatSessionHelpers";
import { useChatHistory } from "./useChatHistory";
import { useChatState } from "./useChatState";
import { useThreadBootstrap } from "./useThreadBootstrap";
import type { UploadedFile } from "../types/file";

export const useChatSessions = (
  userName: string,
  onLmStudioError?: (error: unknown) => void
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const {
    chats,
    setChats,
    activeChat,
    activeChatId,
    setActiveChatId,
    updateChatById,
    appendMessageToChat,
  } = useChatState(userName);
  useThreadBootstrap(userName, chats, setChats, onLmStudioError);
  
  const { isHistoryLoading, loadMessagesForChat, loadOlderMessages } =
    useChatHistory(activeChat, updateChatById, onLmStudioError);

  useEffect(() => {
    if (
      !activeChat ||
      !activeChat.threadId ||
      activeChat.hasLoadedInitial ||
      isHistoryLoading
    ) {
      return;
    }

    void loadMessagesForChat(activeChat, { placement: "prepend" });
  }, [activeChat, isHistoryLoading, loadMessagesForChat]);

  const handleNewChat = useCallback(
    async (title?: string) => {
      const chatTitle = title?.trim() || `Chat ${chats.length + 1}`;
      let threadId: string | undefined;

      try {
        threadId = await Meteor.callAsync("chats.create", chatTitle);
      } catch (error) {
        console.error("Unable to create chat thread", error);
        onLmStudioError?.(error);
      }

      const initialMessage: Message = {
        id: createId(),
        sender: "assistant",
        content: greetingForUser(userName),
        displayText: greetingForUser(userName),
        timestamp: Date.now(),
      };

      const newChat: ChatSession = {
        id: createId(),
        threadId,
        title: chatTitle,
        messages: [initialMessage],
        hasLoadedInitial: true,
        hasMore: false,
        oldestTimestamp: initialMessage.timestamp,
      };

      setChats((current) => [newChat, ...current]);
      setActiveChatId(newChat.id);
    },
    [chats.length, setChats, setActiveChatId, userName]
  );

  const ensureThreadId = useCallback(
    async (chat: ChatSession) => {
      if (chat.threadId) return chat.threadId;

      try {
        const threadId = (await Meteor.callAsync(
          "chats.create",
          chat.title || "Conversation"
        )) as string;

        updateChatById(chat.id, (current) => ({ ...current, threadId }));
        return threadId;
      } catch (error) {
        console.error("Failed to create LM Studio thread", error);
        onLmStudioError?.(error);
        return undefined;
      }
    },
    [updateChatById]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !activeChat) return;
      setIsProcessing(true);
      setProcessingStatus("Sending your message to LM Studio...");
      const userMessage: Message = {
        id: createId(),
        sender: "user",
        content: content.trim(),
        displayText: content.trim(),
        timestamp: Date.now(),
      };
      const threadId = await ensureThreadId(activeChat);
      if (!threadId) {
        setIsProcessing(false);
        return;
      }

      appendMessageToChat(activeChat.id, userMessage, { ensureTitle: true });
      try {
        setProcessingStatus("Awaiting assistant response from LM Studio...");
        const response = await Meteor.callAsync(
          "messages.userSend",
          threadId,
          userMessage.content
        );

        const assistantMessage: Message = {
          id: response?.assistantMessageId || createId(),
          sender: "assistant",
          content:
            response?.assistantText ?? assistantReply(userName, userMessage.content),
          displayText:
            response?.assistantText ?? assistantReply(userName, userMessage.content),
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, assistantMessage);
      } catch (error) {
        console.error("LM Studio reply failed", error);
        onLmStudioError?.(error);
        const fallbackMessage: Message = {
          id: createId(),
          sender: "assistant",
          content:
            "I couldn't get a response from LM Studio right now. Please try again shortly.",
          displayText:
            "I couldn't get a response from LM Studio right now. Please try again shortly.",
          timestamp: Date.now(),
        };
        appendMessageToChat(activeChat.id, fallbackMessage);
      } finally {
        setIsProcessing(false);
        setProcessingStatus(null);
      }
    },
    [activeChat, appendMessageToChat, ensureThreadId, userName]
  );

  const analyzeFile = useCallback(
    async (file: UploadedFile, command?: string) => {
      if (!activeChat) {
        console.warn("No active chat available for file analysis");
        return;
      }

      setIsProcessing(true);
      const threadId = await ensureThreadId(activeChat);
      if (!threadId) {
        setIsProcessing(false);
        setProcessingStatus(null);
        return;
      }

      try {
        const trimmedCommand = command?.trim();
        const isAudioFile = file.contentType?.startsWith("audio/");
        const commandText =
          trimmedCommand && trimmedCommand.length > 0
            ? trimmedCommand
            : isAudioFile
              ? "No specific command provided. Please transcribe the audio, identify the main intent, and list any required actions."
              : "No specific command provided. Please scan the file and provide a concise summary of the contents you processed.";
            
        setProcessingStatus(
          isAudioFile
            ? "Submitting audio for transcription..."
            : "Extracting text from file..."
        );

        const analysisResponse = await Meteor.callAsync(
          isAudioFile ? "audio.transcribe" : "ocr.extractText",
          {
            bucket: file.bucket,
            key: file.key,
            mime_type: file.contentType,
          }
        );

        const userMessage: Message = {
          id: createId(),
          sender: "user",
          content: `${isAudioFile ? "Audio command" : "File command"}: ${commandText}\n\nHere is the ${
            isAudioFile ? "transcription" : "extracted text"
          } from ${file.originalName || "an uploaded file"}:\n\n${
            analysisResponse?.text || "(No text detected)"
          }`,
          displayText:
            trimmedCommand && trimmedCommand.length > 0
              ? trimmedCommand
              : `Shared ${file.originalName || "a file"} for ${
                  isAudioFile ? "voice analysis" : "analysis"
                }`,
          attachments: [
            {
              ...file,
              sent: true,
              instruction: trimmedCommand || undefined,
            },
          ],
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, userMessage, { ensureTitle: true });
        setProcessingStatus(
          isAudioFile
            ? "Sending transcription to LM Studio..."
            : "Sending extracted text to LM Studio..."
        );

        const response = await Meteor.callAsync(
          "messages.userSend",
          threadId,
          userMessage.content
        );

        setProcessingStatus("Awaiting assistant response from LM Studio...");
        const assistantMessage: Message = {
          id: response?.assistantMessageId || createId(),
          sender: "assistant",
          content:
            response?.assistantText ??
            "I extracted the text but could not generate an analysis right now.",
          displayText:
            response?.assistantText ??
            "I extracted the text but could not generate an analysis right now.",
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, assistantMessage);
      } catch (error) {
        console.error("OCR analysis failed", error);
        onLmStudioError?.(error);
        const fallback: Message = {
          id: createId(),
          sender: "assistant",
          content:
            "I couldn't analyze that file. Please try again or share a different document.",
          displayText:
            "I couldn't analyze that file. Please try again or share a different document.",
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, fallback);
      } finally {
        setIsProcessing(false);
        setProcessingStatus(null);
      }
    },
    [activeChat, appendMessageToChat, ensureThreadId, onLmStudioError]
  );

  const removeChat = useCallback(
    async (chatId: string) => {
      if (chatId === activeChatId) {
        console.warn("Refusing to delete the active chat for safety");
        return;
      }
      const chatToDelete = chats.find((chat) => chat.id === chatId);
      setChats((current) => {
        const updated = current.filter((chat) => chat.id !== chatId);
        if (activeChatId === chatId) {
          setActiveChatId(updated[0]?.id ?? null);
        }
        return updated;
      });

      if (chatToDelete?.threadId) {
        try {
          await Meteor.callAsync("chats.delete", chatToDelete.threadId);
        } catch (error) {
          console.error("Unable to delete chat thread", error);
          onLmStudioError?.(error);
        }
      }
    },
    [activeChatId, chats, onLmStudioError, setActiveChatId, setChats]
  );

  return {
    chats,
    activeChat,
    activeChatId,
    isProcessing,
    processingStatus,
    isHistoryLoading,
    canLoadMoreHistory: activeChat?.hasMore ?? false,
    setActiveChatId,
    handleNewChat,
    sendMessage,
    analyzeFile,
    loadOlderMessages,
    removeChat,
  };
};
