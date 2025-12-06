import { S3Client } from "@aws-sdk/client-s3";
import { Meteor } from "meteor/meteor";

const settings = Meteor.settings.minio;

export const minioClient = new S3Client({
  region: settings.region ?? "us-east-1",
  endpoint: settings.endPoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: settings.accessKey,
    secretAccessKey: settings.secretKey,
  },
});
