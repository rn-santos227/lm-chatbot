import { ChatSession, Message } from "../types/session";

export const MESSAGE_PAGE_SIZE = 30;
export const createId = () => Math.random().toString(36).slice(2, 10);

export const toClientMessage = (
  doc: Pick<Message, "content" | "sender"> & { _id?: string; createdAt: Date }
): Message => ({
  id: doc._id || createId(),
  sender: doc.sender,
  content: doc.content,
  timestamp: doc.createdAt.getTime(),
});

export const greetingForUser = (name?: string) =>
  `Hi${name ? `, ${name}` : " there"}! I'm your assistant—how can I help today?`;

export const assistantReply = (name: string, prompt: string) =>
  `Thanks for sharing, ${name || "friend"}. You said: "${prompt}". How else can I support you?`;

export const computeOldestTimestamp = (messages: Message[]) =>
  messages.length ? Math.min(...messages.map((msg) => msg.timestamp)) : null;

export const mergeMessages = (
  existing: Message[],
  incoming: Message[],
  placement: "prepend" | "append"
) => {
  const existingIds = new Set(existing.map((msg) => msg.id));
  const dedupedIncoming = incoming.filter((msg) => !existingIds.has(msg.id));

  return placement === "prepend"
    ? [...dedupedIncoming, ...existing]
    : [...existing, ...dedupedIncoming];
};

export const mergeChatWithMessages = (
  chat: ChatSession,
  incoming: Message[],
  placement: "prepend" | "append",
  hasMore: boolean
): ChatSession => {
  const mergedMessages = mergeMessages(chat.messages, incoming, placement);

  return {
    ...chat,
    messages: mergedMessages,
    hasMore,
    oldestTimestamp:
      computeOldestTimestamp(mergedMessages) ?? chat.oldestTimestamp ?? null,
    hasLoadedInitial: true,
  };
};

export const loadChats = (username: string): ChatSession[] => {
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
