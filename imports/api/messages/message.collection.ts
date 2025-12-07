import { Mongo } from "meteor/mongo";
import type { MessageDoc } from "./message.type";

export const Messages = new Mongo.Collection<MessageDoc>("messages");

Messages.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});
