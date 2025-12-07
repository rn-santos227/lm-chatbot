import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ChatSession, Message } from "../types/session";
import { loadChats } from "./chatSessionHelpers";

export type UpdateChatById = (
  chatId: string,
  updater: (chat: ChatSession) => ChatSession
) => void;

export const useChatState = (userName: string) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!userName) {
      return;
    }

    const loaded = loadChats(userName);
    setChats(loaded);
    setActiveChatId(loaded[0]?.id ?? null);
  }, [userName]);

  useEffect(() => {
    if (!chats.length) return;
    localStorage.setItem("chat-sessions", JSON.stringify(chats));
  }, [chats]);

  const updateChatById: UpdateChatById = useCallback(
    (chatId, updater) => {
      setChats((current) =>
        current.map((chat) => (chat.id === chatId ? updater(chat) : chat))
      );
    },
    []
  );

  const appendMessageToChat = useCallback(
    (
      chatId: string,
      message: Message,
      { ensureTitle }: { ensureTitle?: boolean } = {}
    ) => {
      updateChatById(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, message],
        title: ensureTitle ? chat.title || "Conversation" : chat.title,
        hasLoadedInitial: true,
        hasMore: chat.hasMore ?? false,
        oldestTimestamp: chat.oldestTimestamp ?? message.timestamp,
      }));
    },
    [updateChatById]
  );

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats]
  );

  return {
    chats,
    setChats: setChats as Dispatch<SetStateAction<ChatSession[]>>,
    activeChatId,
    setActiveChatId,
    activeChat,
    updateChatById,
    appendMessageToChat,
  };
};
