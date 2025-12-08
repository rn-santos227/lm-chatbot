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
      const userMessage: Message = {
        id: createId(),
        sender: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };
      const threadId = await ensureThreadId(activeChat);
      if (!threadId) {
        setIsProcessing(false);
        return;
      }

      appendMessageToChat(activeChat.id, userMessage, { ensureTitle: true });
      try {
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
          timestamp: Date.now(),
        };
        appendMessageToChat(activeChat.id, fallbackMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [activeChat, appendMessageToChat, ensureThreadId, userName]
  );

  const analyzeFile = useCallback(
    async (file: UploadedFile) => {
      if (!activeChat) {
        console.warn("No active chat available for OCR analysis");
        return;
      }

      setIsProcessing(true);
      const threadId = await ensureThreadId(activeChat);
      if (!threadId) {
        setIsProcessing(false);
        return;
      }

      try {
        const ocrResponse = await Meteor.callAsync("ocr.extractText", {
          bucket: file.bucket,
          key: file.key,
          mime_type: file.contentType,
        });

        const userMessage: Message = {
          id: createId(),
          sender: "user",
          content: `Here is the extracted text from ${
            file.originalName || "an uploaded file"
          }:\n\n${ocrResponse?.text ?? "(No text detected)"}`,
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, userMessage, { ensureTitle: true });

        const response = await Meteor.callAsync(
          "messages.userSend",
          threadId,
          userMessage.content
        );

        const assistantMessage: Message = {
          id: response?.assistantMessageId || createId(),
          sender: "assistant",
          content:
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
          timestamp: Date.now(),
        };

        appendMessageToChat(activeChat.id, fallback);
      } finally {
        setIsProcessing(false);
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
