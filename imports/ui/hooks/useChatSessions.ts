import { useEffect, useMemo, useState } from "react";
import { Meteor } from "meteor/meteor";

import { ChatSession, Message } from "../types/session";

const MESSAGE_PAGE_SIZE = 30;
const createId = () => Math.random().toString(36).slice(2, 10);

const toClientMessage = (
  doc: Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }
): Message => ({
  id: doc._id || createId(),
  sender: doc.sender,
  content: doc.content,
  timestamp: doc.createdAt.getTime(),
});

const greetingForUser = (name?: string) =>
  `Hi${name ? `, ${name}` : " there"}! I'm your assistant—how can I help today?`;

const assistantReply = (name: string, prompt: string) =>
  `Thanks for sharing, ${name || "friend"}. You said: "${prompt}". How else can I support you?`;

const loadChats = (username: string): ChatSession[] => {
  const stored = localStorage.getItem("chat-sessions");

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ChatSession[];
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map((chat) => ({
          ...chat,
          hasLoadedInitial: chat.hasLoadedInitial ?? true,
          hasMore: chat.hasMore ?? false,
          oldestTimestamp:
            chat.oldestTimestamp ?? chat.messages[0]?.timestamp ?? null,
        }));
      }
    } catch (error) {
      console.warn("Unable to parse stored chats", error);
    }
  }

  const initialMessage: Message = {
    id: createId(),
    sender: "assistant",
    content: greetingForUser(username),
    timestamp: Date.now(),
  };

  return [
    {
      id: createId(),
      title: "Welcome",
      messages: [initialMessage],
      hasMore: false,
      hasLoadedInitial: true,
      oldestTimestamp: initialMessage.timestamp,
    },
  ];
};

export const useChatSessions = (userName: string) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (!userName) {
      return;
    }

    const loaded = loadChats(userName);
    setChats(loaded);
    setActiveChatId(loaded[0]?.id ?? null);


    const ensureThreads = async () => {
      const withThreads: ChatSession[] = [];

      for (const chat of loaded) {
        if (chat.threadId) {
          withThreads.push(chat);
          continue;
        }

        try {
          const threadId = (await Meteor.callAsync(
            "chats.create",
            chat.title || "Conversation"
          )) as string;

          withThreads.push({ ...chat, threadId });
        } catch (error) {
          console.error("Failed to create LM Studio thread", error);
          withThreads.push(chat);
        }
      }

      setChats(withThreads);
    };

    void ensureThreads();
  }, [userName]);

  useEffect(() => {
    if (!chats.length) return;
    localStorage.setItem("chat-sessions", JSON.stringify(chats));
  }, [chats]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats]
  );

  useEffect(() => {
    const target = chats.find((chat) => chat.id === activeChatId);

    if (!target || !target.threadId || target.hasLoadedInitial || isHistoryLoading) {
      return;
    }

    const loadLatest = async () => {
      setIsHistoryLoading(true);

      try {
        const docs = (await Meteor.callAsync(
          "messages.fetchPage",
          target.threadId,
          { limit: MESSAGE_PAGE_SIZE }
        )) as Array<
          Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }
        >;

        const loadedMessages = docs.map(toClientMessage);

        setChats((current) =>
          current.map((chat) => {
            if (chat.id !== target.id) return chat;

            const existingIds = new Set(chat.messages.map((msg) => msg.id));
            const mergedMessages = [
              ...loadedMessages,
              ...chat.messages.filter((msg) => !existingIds.has(msg.id)),
            ];

            const oldestTimestamp = mergedMessages.length
              ? Math.min(...mergedMessages.map((msg) => msg.timestamp))
              : null;

            return {
              ...chat,
              messages: mergedMessages,
              hasMore: loadedMessages.length === MESSAGE_PAGE_SIZE,
              oldestTimestamp,
              hasLoadedInitial: true,
            };
          })
        );
      } catch (error) {
        console.error("Failed to load latest messages", error);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void loadLatest();
  }, [activeChatId, chats, isHistoryLoading]);

  const handleNewChat = async (title?: string) => {
    const chatTitle = title?.trim() || `Chat ${chats.length + 1}`;
    let threadId: string | undefined;

    try {
      threadId = await Meteor.callAsync("chats.create", chatTitle);
    } catch (error) {
      console.error("Unable to create chat thread", error);
    }

    const newChat: ChatSession = {
      id: createId(),
      threadId,
      title: chatTitle,
      messages: [
        {
          id: createId(),
          sender: "assistant",
          content: greetingForUser(userName),
          timestamp: Date.now(),
        },
      ],
      hasLoadedInitial: true,
      hasMore: false,
      oldestTimestamp: Date.now(),
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const ensureThreadId = async (chat: ChatSession) => {
    if (chat.threadId) return chat.threadId;

    const threadId = await Meteor.callAsync(
      "chats.create",
      chat.title || "Conversation"
    );

    setChats((current) =>
      current.map((c) => (c.id === chat.id ? { ...c, threadId } : c))
    );

    return threadId;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeChat) return;
    setIsProcessing(true);

    const userMessage: Message = {
      id: createId(),
      sender: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };
    const threadId = await ensureThreadId(activeChat);

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title: chat.title || "Conversation",
              hasLoadedInitial: true,
              hasMore: chat.hasMore ?? false,
              oldestTimestamp:
                chat.oldestTimestamp ?? userMessage.timestamp,
            }
          : chat
      )
    );

    try {
      const response = await Meteor.callAsync(
        "messages.userSend",
        threadId,
        userMessage.content
      );

      const assistantMessage: Message = {
        id: response?.assistantMessageId || createId(),
        sender: "assistant",
        content: response?.assistantText ??
          assistantReply(userName, userMessage.content),
        timestamp: Date.now(),
      };

      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
                hasLoadedInitial: true,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("LM Studio reply failed", error);

      const fallbackMessage: Message = {
        id: createId(),
        sender: "assistant",
        content:
          "I couldn't get a response from LM Studio right now. Please try again shortly.",
        timestamp: Date.now(),
      };

      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: [...chat.messages, fallbackMessage],
                hasLoadedInitial: true,
              }
            : chat
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };


  const loadOlderMessages = async () => {
    if (!activeChat?.threadId || isHistoryLoading) {
      return;
    }

    setIsHistoryLoading(true);

    try {
      const beforeDate = activeChat.oldestTimestamp
        ? new Date(activeChat.oldestTimestamp)
        : new Date();

      const docs = (await Meteor.callAsync(
        "messages.fetchPage",
        activeChat.threadId,
        { before: beforeDate, limit: MESSAGE_PAGE_SIZE }
      )) as Array<
        Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }
      >;

      const olderMessages = docs.map(toClientMessage);

      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== activeChat.id) return chat;

          const existingIds = new Set(chat.messages.map((msg) => msg.id));
          const dedupedOlder = olderMessages.filter(
            (msg) => !existingIds.has(msg.id)
          );
          const updatedMessages = [...dedupedOlder, ...chat.messages];
          const oldestTimestamp = updatedMessages.length
            ? Math.min(...updatedMessages.map((msg) => msg.timestamp))
            : chat.oldestTimestamp ?? null;

          return {
            ...chat,
            messages: updatedMessages,
            hasMore: olderMessages.length === MESSAGE_PAGE_SIZE,
            oldestTimestamp,
            hasLoadedInitial: true,
          };
        })
      );
    } catch (error) {
      console.error("Failed to load older messages", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const removeChat = async (chatId: string) => {
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
      }
    }
  };

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
    loadOlderMessages,
    removeChat,
  };
};
