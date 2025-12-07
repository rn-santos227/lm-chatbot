import { Meteor } from 'meteor/meteor';

import "../imports/api/chats/chat.publications";
import "../imports/api/chats/chat.methods";

import "../imports/api/messages/message.publications";
import "../imports/api/messages/message.methods";

import "../imports/api/lmstudio/lmstudio.methods";

import "./minio/client";
import "./minio/upload";

Meteor.startup(async () => {
  const minio = Meteor.settings.minio;
  
  console.log("[MinIO] Connected to:", minio.endPoint, "port:", minio.port);
  console.log("🚀 Meteor server started.");
});
