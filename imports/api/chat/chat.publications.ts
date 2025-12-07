import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection";

Meteor.publish("chats.all", function () {
  return Chats.find({}, {
    sort: { updatedAt: -1 },
  });
});

Meteor.publish("chats.single", function (threadId: string) {
  if (!threadId || typeof threadId !== "string") {
    return this.ready();
  }

  return Chats.find({ _id: threadId });
});
