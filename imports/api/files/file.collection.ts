import { Mongo } from "meteor/mongo";
import type { FileDoc } from "./file.types";

export const Files = new Mongo.Collection<FileDoc>("files");

Files.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});
