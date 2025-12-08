import { WebApp } from "meteor/webapp";
import { Random } from "meteor/random";
import { Meteor } from "meteor/meteor";
import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { minioClient } from "./client";

import { Files } from "../../imports/api/files/file.collection";
import type { FileDoc } from "../../imports/api/files/file.types";

const minio = Meteor.settings.minio;

WebApp.connectHandlers.use("/upload", (req, res, next) => {
  if (req.method !== "POST") return next();

  const originalName = req.headers["x-file-name"] as string;
  const contentType = req.headers["x-file-type"] as string;

  if (!originalName || !contentType) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Missing headers" }));
    return;
  }

  const fileName = `${Random.id()}-${originalName}`;
  const bucket = minio.bucket;

  const chunks: Uint8Array[] = [];
  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", async () => {
    try {
      const buffer = Buffer.concat(chunks);

      await minioClient.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const finalUrl = `${minio.publicBaseUrl}/${bucket}/${fileName}`;
      const fileDoc: FileDoc = {
        bucket,
        key: fileName,
        url: finalUrl,
        contentType,
        size: buffer.length,
        originalName,
        createdAt: new Date(),
      };

      const fileId = await Files.insertAsync(fileDoc);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          url: finalUrl,
          bucket,
          key: fileName,
          contentType,
          fileId,
          size: buffer.length,
          originalName,
        })
      );
    } catch (err) {
      console.error("Upload error:", err);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upload failed", details: err }));
    }
  });
});
