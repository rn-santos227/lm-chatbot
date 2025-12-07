import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection"
import { Messages } from "../messages/message.collection";

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
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID must be a string.");
    }

    Chats.update(threadId, {
      $set: {
        title,
        updatedAt: new Date(),
      },
    });
  },

  "chats.delete"(threadId: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID must be a string.");
    }

    Chats.remove(threadId);
    Messages.remove({ threadId });
    return true;
  }
});
