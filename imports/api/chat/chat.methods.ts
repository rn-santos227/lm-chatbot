import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection";
import type { ChatThread } from "./chat.type"

Meteor.methods({
  "chats.create"(title: string): string {
    if (!title || typeof title !== "string") {
      throw new Meteor.Error("invalid-title", "Chat title must be a non-empty string.");
    }

    const now = new Date();
    const threadId = Chats.insert({
      title: "New Chat",
      createdAt: now,
      updatedAt: now,
      model: Meteor.settings.lmstudio.model,
      temperature: 0.2,
    });

    return threadId;
  },
});
