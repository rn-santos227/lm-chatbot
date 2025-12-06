import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
  const minio = Meteor.settings.minio;
  
  console.log("[MinIO] Connected to:", minio.endPoint, "port:", minio.port);
  console.log("🚀 Meteor server started.");
});
