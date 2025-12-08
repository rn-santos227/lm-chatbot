import { S3Client } from "@aws-sdk/client-s3";
import { Meteor } from "meteor/meteor";

const settings = Meteor.settings.minio;

const endpoint = (() => {
  const rawEndpoint = settings.endPoint;

  if (!rawEndpoint) {
    throw new Error("MinIO endpoint is not configured");
  }

  const hasProtocol = /^https?:\/\//i.test(rawEndpoint);
  const base = hasProtocol ? rawEndpoint : `http://${rawEndpoint}`;

  return settings.port ? `${base}:${settings.port}` : base;
})();

export const minioClient = new S3Client({
  region: settings.region ?? "us-east-1",
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: settings.accessKey,
    secretAccessKey: settings.secretKey,
  },
});
