import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection";
import type { ChatThread } from "./chat.type"

Meteor.methods({
  "chats.create"(title: string): string {
    if (!title || typeof title !== "string") {
      throw new Meteor.Error("invalid-title", "Chat title must be a non-empty string.");
    }

    const cleanedTitle = title.trim() || "New Chat";
    const now = new Date();

    const threadId = Chats.insert({
      title: cleanedTitle,
      createdAt: now,
      updatedAt: now,
      model: Meteor.settings.lmstudio.model,
      temperature: 0.2,
    });

    return threadId;
  },

  "chats.rename"(threadId: string, title: string) {

  },
});
