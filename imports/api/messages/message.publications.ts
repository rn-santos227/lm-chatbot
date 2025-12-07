import { Meteor } from "meteor/meteor";
import { Messages } from "./message.collection";

Meteor.publish("messages.latest", function (
  threadId: string,
  limit: number = 30
) {
  if (!threadId || typeof threadId !== "string") {
    return this.ready();
  }

  return Messages.find(
    { threadId },
    {
      sort: { createdAt: -1 },
      limit,
    }
  );
});

Meteor.publish("messages.before", function (
  threadId: string,
  before: Date,
  limit: number = 30
) {
  if (
    !threadId ||
    typeof threadId !== "string" ||
    !before ||
    !(before instanceof Date)
  ) {
    return this.ready();
  }

  return Messages.find(
    {
      threadId,
      createdAt: { $lt: before },
    },
    {
      sort: { createdAt: -1 },
      limit,
    }
  );
});

