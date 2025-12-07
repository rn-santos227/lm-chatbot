import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

const lm = Meteor.settings.lmstudio;
const BASE_URL = lm?.base ?? "http://127.0.0.1:1234";

Meteor.methods({
  async "lmstudio.health"(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/v1/models`);
      if (response.ok) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("LM Studio health check failed", error);
      return false;
    }
  },
});
