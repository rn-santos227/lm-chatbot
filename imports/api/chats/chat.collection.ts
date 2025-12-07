import { Mongo } from "meteor/mongo";
import type { ChatThread } from "./chat.types";

export const Chats = new Mongo.Collection<ChatThread>("chats");

Chats.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
