import { useEffect, useMemo, useState } from "react";
import { Meteor } from "meteor/meteor";

import { ChatSession, Message } from "../types/session";

const createId = () => Math.random().toString(36).slice(2, 10);

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
        return parsed;
      }
    } catch (error) {
      console.warn("Unable to parse stored chats", error);
    }
  }

  return [
    {
      id: createId(),
      title: "Welcome",
      messages: [
        {
          id: createId(),
          sender: "assistant",
          content: greetingForUser(username),
          timestamp: Date.now(),
        },
      ],
    },
  ];
};

export const useChatSessions = (userName: string) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
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
            ? { ...chat, messages: [...chat.messages, fallbackMessage] }
            : chat
        )
      );
    } finally {
      setIsProcessing(false);
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
    setActiveChatId,
    handleNewChat,
    sendMessage,
    removeChat,
  };
};
