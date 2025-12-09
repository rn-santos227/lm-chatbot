import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import type {
  AudioTranscriptionRequest,
  AudioTranscriptionResponse,
} from "./audio.types";

const AUDIO_BASE_URL = Meteor.settings.audio?.baseUrl ?? "http://127.0.0.1:8002";

Meteor.methods({
  async "audio.transcribe"(
    payload: AudioTranscriptionRequest
  ): Promise<AudioTranscriptionResponse> {
    try {
      const response = await fetch(`${AUDIO_BASE_URL}/transcribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Meteor.Error(
          "audio-failed",
          `Audio service returned status ${response.status}`
        );
      }

      const data = (await response.json()) as AudioTranscriptionResponse;
      return data;
    } catch (error) {
      if (error instanceof Meteor.Error) {
        throw error;
      }
      throw new Meteor.Error(
        "audio-error",
        "Unable to transcribe audio"
      );
    }
  },
});
