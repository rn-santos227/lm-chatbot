import { Meteor } from "meteor/meteor";
import { Messages } from "./message.collection";
import type { MessageDoc } from "./message.types";

import { Chats } from "../chats/chat.collection";
import type { LMMessage, LMChatResponse } from "../lmstudio/lmstudio.types";
import { lmChatRequest } from "../lmstudio/lmstudio.service";

Meteor.methods({
  async "messages.userSend"(threadId: string, text: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "threadId must be a string");
    }

    if (!text || typeof text !== "string") {
      throw new Meteor.Error("invalid-text", "Message text must be a string");
    }

    const now = new Date();
    const chat = Chats.findOne(threadId);
    if (!chat) {
      throw new Meteor.Error("not-found", "Chat thread not found");
    }

    const userMessageId = Messages.insert({
      threadId,
      sender: "user",
      content: text,
      createdAt: now,
    });

    const historyDocs = Messages.find(
      { threadId },
      { sort: { createdAt: 1 } }
    ).fetch();

    const history: LMMessage[] = historyDocs.map((m) => ({
      role: m.sender === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const reply = await lmChatRequest(
      history,
      chat.model,
      chat.temperature
    );

    const assistantMessageId = Messages.insert({
      threadId,
      sender: "assistant",
      content: reply.content,
      raw: reply.raw,
      createdAt: new Date(),
    });

    Chats.update(threadId, {
      $set: { updatedAt: new Date() },
    });

    return {
      userMessageId,
      assistantMessageId,
      assistantText: reply.content,
    };
  },

  "messages.assistantSend"(
    threadId: string,
    content: string,
    raw?: LMChatResponse
  ): string {
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

    return Messages.insert(msg);
  },

  "messages.deleteByThread"(threadId: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID required");
    }

    return Messages.remove({ threadId });
  },
});
