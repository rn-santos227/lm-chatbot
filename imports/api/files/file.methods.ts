import { Meteor } from "meteor/meteor";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { Files } from "./file.collection";
import type { FileDoc } from "./file.types";

import { minioClient } from "../../../server/minio/client";

Meteor.methods({

});
