import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import type { OCRRequest, OCRResponse } from "./ocr.types";

const OCR_BASE_URL = Meteor.settings.ocr?.baseUrl ?? "http://127.0.0.1:8001";


