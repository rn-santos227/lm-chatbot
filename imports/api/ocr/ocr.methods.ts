import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import type { OCRRequest, OCRResponse } from "./ocr.types";
const OCR_BASE_URL = Meteor.settings.ocr?.baseUrl ?? "http://127.0.0.1:8001";

Meteor.methods({
  async "ocr.extractText"(payload: OCRRequest): Promise<OCRResponse> {
    if (!payload || typeof payload !== "object") {
      throw new Meteor.Error("invalid-request", "OCR request payload is required.");
    }

    const { bucket, key, mime_type } = payload;

    if (!bucket || typeof bucket !== "string") {
      throw new Meteor.Error("invalid-bucket", "Bucket is required for OCR requests.");
    }

    if (!key || typeof key !== "string") {
      throw new Meteor.Error("invalid-key", "Object key is required for OCR requests.");
    }

    if (!mime_type || typeof mime_type !== "string") {
      throw new Meteor.Error(
        "invalid-mime-type",
        "MIME type must be provided to select an OCR strategy."
      );
    }

    try {
      const response = await fetch(`${OCR_BASE_URL}/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucket, key, mime_type }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Meteor.Error(
          "ocr-failed",
          `OCR service returned ${response.status}: ${detail || "Unknown error"}`
        );
      }

      const data = (await response.json()) as OCRResponse;
      return data;
    } catch (error) {
      console.error("OCR request failed", error);
      if (error instanceof Meteor.Error) {
        throw error;
      }

      throw new Meteor.Error(
        "ocr-error",
        "Unable to complete OCR request. Please try again later."
      );
    }
  },
});
