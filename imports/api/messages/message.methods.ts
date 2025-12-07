import { Meteor } from "meteor/meteor";
import { Messages } from "./message.collection";
import type { MessageDoc } from "./message.types";

Meteor.methods({
  "messages.userSend"(threadId: string, text: string): string {
    if (!threadId || typeof threadId !== "string") {
      throw new Meteor.Error("invalid-thread", "threadId must be a string");
    }
  },
});
