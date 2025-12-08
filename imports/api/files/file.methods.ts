import { Meteor } from "meteor/meteor";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { Files } from "./file.collection";
import type { FileDoc } from "./file.types";

import { minioClient } from "../../../server/minio/client";

Meteor.methods({
  async "files.list"() {
    return Files.find({}, { sort: { createdAt: -1 } }).fetchAsync();
  },

  async "files.register"(doc: FileDoc): Promise<string> {
    if (!doc || typeof doc !== "object") {
      throw new Meteor.Error("invalid-file", "File metadata is required.");
    }

    const { bucket, key, url, contentType, size, originalName, uploaderId, metadata } = doc;

    if (!bucket || typeof bucket !== "string") {
      throw new Meteor.Error("invalid-bucket", "Bucket is required.");
    }

    if (!key || typeof key !== "string") {
      throw new Meteor.Error("invalid-key", "Object key is required.");
    }

    if (!url || typeof url !== "string") {
      throw new Meteor.Error("invalid-url", "Object URL is required.");
    }

    if (!contentType || typeof contentType !== "string") {
      throw new Meteor.Error("invalid-type", "Content type is required.");
    }

    if (!Number.isFinite(size) || size < 0) {
      throw new Meteor.Error("invalid-size", "File size must be a positive number.");
    }

    const now = new Date();

    return Files.insertAsync({
      bucket,
      key,
      url,
      contentType,
      size,
      originalName,
      createdAt: now,
      uploaderId,
      metadata,
    });
  },


  async "files.delete"(fileId: string) {
    if (!fileId || typeof fileId !== "string") {
      throw new Meteor.Error("invalid-id", "File id must be a string.");
    }

    const doc = await Files.findOneAsync(fileId);

    if (!doc) {
      throw new Meteor.Error("not-found", "File not found.");
    }

    await minioClient.send(
      new DeleteObjectCommand({
        Bucket: doc.bucket,
        Key: doc.key,
      })
    );

    await Files.removeAsync(fileId);
    return true;
  },
});
