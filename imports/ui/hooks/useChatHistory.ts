import { useCallback, useState } from "react";
import { Meteor } from "meteor/meteor";

import { ChatSession, Message } from "../types/session";
import {
  MESSAGE_PAGE_SIZE,
  mergeChatWithMessages,
  toClientMessage,
} from "./chatSessionHelpers";
import { UpdateChatById } from "./useChatState";

type LoadOptions = { before?: Date; placement: "prepend" | "append" };

export const useChatHistory = (
  activeChat: ChatSession | null,
  updateChatById: UpdateChatById
) => {
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchMessages = useCallback(
    async (
      threadId: string,
      options: { before?: Date; limit: number }
    ): Promise<
      Array<Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }>
    > =>
      (await Meteor.callAsync("messages.fetchPage", threadId, options)) as Array<
        Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }
      >,
    []
  );

  const loadMessagesForChat = useCallback(
    async (chat: ChatSession, options: LoadOptions) => {
      if (!chat.threadId) return;

      setIsHistoryLoading(true);

      try {
        const docs = await fetchMessages(chat.threadId, {
          before: options.before,
          limit: MESSAGE_PAGE_SIZE,
        });

        const loadedMessages = docs.map(toClientMessage);

        updateChatById(chat.id, (currentChat) =>
          mergeChatWithMessages(
            currentChat,
            loadedMessages,
            options.placement,
            loadedMessages.length === MESSAGE_PAGE_SIZE
          )
        );
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [fetchMessages, updateChatById]
  );

  const loadOlderMessages = useCallback(async () => {
    if (!activeChat?.threadId || isHistoryLoading) {
      return;
    }

    const beforeDate = activeChat.oldestTimestamp
      ? new Date(activeChat.oldestTimestamp)
      : new Date();

    await loadMessagesForChat(activeChat, {
      before: beforeDate,
      placement: "prepend",
    });
  }, [activeChat, isHistoryLoading, loadMessagesForChat]);

  return {
    isHistoryLoading,
    loadMessagesForChat,
    loadOlderMessages,
  };
};
