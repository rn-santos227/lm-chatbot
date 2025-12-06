import { WebApp } from "meteor/webapp";
import { Random } from "meteor/random";
import { Meteor } from "meteor/meteor";
import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { minioClient } from "./client"

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

    } catch (err) {
      console.error("Upload error:", err);

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upload failed", details: err }));
    }
  });
});
