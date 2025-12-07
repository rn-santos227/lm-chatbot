import { Meteor } from "meteor/meteor";
import { Chats } from "./chat.collection";

Meteor.publish("chats.all", function () {
  return Chats.find({}, {
    sort: { updatedAt: -1 },
  });
});
