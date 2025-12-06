import { WebApp } from "meteor/webapp";
import { Random } from "meteor/random";
import { Meteor } from "meteor/meteor";
import {
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { minioClient } from "./client"

const minio = Meteor.settings.minio;

WebApp.connectHandlers.use("/upload", (req, res, next) => {

});
