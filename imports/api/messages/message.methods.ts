import { Meteor } from "meteor/meteor";
import { Messages } from "./message.collection";
import type { MessageDoc } from "./message.types";

import { Chats } from "../chats/chat.collection";
import type { LMMessage, LMChatResponse } from "../lmstudio/lmstudio.types";
import { lmChatRequest } from "../lmstudio/lmstudio.service";

const MAX_CONTEXT_MESSAGES = 6;
const MAX_MEMORY_ITEMS = 10;
const MAX_CONTEXT_CHARS = 700;
const DEFAULT_FETCH_LIMIT = 30;
const MAX_FETCH_LIMIT = 100;

const buildSystemPrompt = (memory: string[] = []): LMMessage => {
  const basePrompt =
    "You are a concise, thoughtful assistant. Prefer short, actionable replies and avoid repeating the question.";

  if (!memory.length) {
    return { role: "system", content: basePrompt };
  }

  const memoryText = memory
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");

  return {
    role: "system",
    content: `${basePrompt}\n\nPersistent memory for this chat:\n${memoryText}`,
  };
};

const trimForContext = (text: string): string =>
  text.length > MAX_CONTEXT_CHARS ? `${text.slice(0, MAX_CONTEXT_CHARS)}...` : text;

const toLMHistory = (docs: MessageDoc[]): LMMessage[] =>
  docs.map((m) => ({
    role: m.sender === "assistant" ? "assistant" : "user",
    content: trimForContext(m.content),
  }));

const createMemoryEntry = (userText: string, assistantText: string): string => {
  const combined = `User: ${userText}\nAssistant: ${assistantText}`;
  const MAX_LENGTH = 500;

  return combined.length > MAX_LENGTH
    ? `${combined.slice(0, MAX_LENGTH)}...`
    : combined;
};

Meteor.methods({
  async "messages.userSend"(threadId: string, text: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "threadId must be a string");
    }

    if (!text || typeof text !== "string") {
      throw new Meteor.Error("invalid-text", "Message text must be a string");
    }

    const now = new Date();
    const chat = await Chats.findOneAsync(threadId);
    if (!chat) {
      throw new Meteor.Error("not-found", "Chat thread not found");
    }

    const userMessageId = await Messages.insertAsync({
      threadId,
      sender: "user",
      content: text,
      createdAt: now,
    });

    const historyDocs = await Messages.find(
      { threadId },
      {
        sort: { createdAt: -1 },
        limit: MAX_CONTEXT_MESSAGES,
        fields: { content: 1, sender: 1 },
      }
    ).fetchAsync();

    const recentHistory = toLMHistory(historyDocs.reverse());
    const systemPrompt = buildSystemPrompt(chat.memory);

    const reply = await lmChatRequest(
      [systemPrompt, ...recentHistory],
      chat.model,
      chat.temperature
    );

    const assistantMessageId = await Messages.insertAsync({
      threadId,
      sender: "assistant",
      content: reply.content,
      raw: reply.raw,
      createdAt: new Date(),
    });

    const memoryEntry = createMemoryEntry(text, reply.content);
    await Chats.updateAsync(threadId, {
      $set: {
        updatedAt: new Date(),
        memory: [...(chat.memory ?? []), memoryEntry].slice(-MAX_MEMORY_ITEMS),
      },
    });

    return {
      userMessageId,
      assistantMessageId,
      assistantText: reply.content,
    };
  },

  async "messages.fetchPage"(
    threadId: string,
    options?: { before?: Date; limit?: number }
  ): Promise<Array<Pick<MessageDoc, "_id" | "sender" | "content" | "createdAt">>> {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID required");
    }

    const limit = Math.min(
      Math.max(options?.limit ?? DEFAULT_FETCH_LIMIT, 1),
      MAX_FETCH_LIMIT
    );

    const query: Record<string, unknown> = { threadId };

    if (options?.before) {
      query.createdAt = { $lt: options.before };
    }

    const docs = await Messages.find(query, {
      sort: { createdAt: -1 },
      limit,
      fields: { content: 1, sender: 1, createdAt: 1 },
    }).fetchAsync();

    return docs.reverse();
  },

  async "messages.assistantSend"(
    threadId: string,
    content: string,
    raw?: LMChatResponse
  ): Promise<string> {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "threadId must be a string");
    }
    if (!content || typeof content !== "string") {
      throw new Meteor.Error("invalid-content", "Assistant content must be a string");
    }

    const msg: MessageDoc = {
      threadId,
      sender: "assistant",
      content,
      raw,
      createdAt: new Date(),
    };

    return Messages.insertAsync(msg);
  },

  async "messages.deleteByThread"(threadId: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID required");
    }

    return Messages.removeAsync({ threadId });
  },
});
