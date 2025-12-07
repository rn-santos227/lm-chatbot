import { useEffect, useMemo, useState } from "react";

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

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats]
  );

  const handleNewChat = () => {
    const newChat: ChatSession = {
      id: createId(),
      title: `Chat ${chats.length + 1}`,
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

  const sendMessage = (content: string) => {
    if (!content.trim() || !activeChat) return;

    const userMessage: Message = {
      id: createId(),
      sender: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id !== activeChat.id) return chat;

      const updatedMessages = [...chat.messages, userMessage];
      return { ...chat, messages: updatedMessages, title: chat.title || "Conversation" };
    });

    setChats(updatedChats);

    const assistantMessage: Message = {
      id: createId(),
      sender: "assistant",
      content: assistantReply(userName, userMessage.content),
      timestamp: Date.now(),
    };

    setChats((current) =>
      current.map((chat) =>
        chat.id === activeChat.id
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      )
    );
  };

  return {
    chats,
    activeChat,
    activeChatId,
    setActiveChatId,
    handleNewChat,
    sendMessage,
  };
};
