import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection"
import { Messages } from "../messages/message.collection";

Meteor.methods({
  async "chats.create"(title: string): Promise<string> {
    if (!title || typeof title !== "string") {
      throw new Meteor.Error("invalid-title", "Chat title must be a non-empty string.");
    }

    const cleanedTitle = title.trim() || "New Chat";
    const now = new Date();

    const threadId = await Chats.insertAsync({
      title: cleanedTitle,
      createdAt: now,
      updatedAt: now,
      model: Meteor.settings.lmstudio.model,
      temperature: 0.2,
    });

    return threadId;
  },

  async "chats.rename"(threadId: string, title: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID must be a string.");
    }

    await Chats.updateAsync(threadId, {
      $set: {
        title,
        updatedAt: new Date(),
      },
    });
  },

  async "chats.delete"(threadId: string) {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "Thread ID must be a string.");
    }

    await Chats.removeAsync(threadId);
    await Messages.removeAsync({ threadId });
    return true;
  }
});
