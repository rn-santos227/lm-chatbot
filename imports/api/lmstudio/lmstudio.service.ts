import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import type {
  LMMessage,
  LMChatResponse,
} from "./lmstudio.types";

const lm = Meteor.settings.lmstudio;

const BASE_URL = lm?.base ?? "http://127.0.0.1:1234";
const DEFAULT_MODEL = lm?.model ?? "gpt-3.5-turbo";
const DEFAULT_TEMPERATURE = lm?.temperature ?? 0.2;

export interface LMStudioReply {
  content: string;
  raw: LMChatResponse;
}

export async function lmChatRequest(
  messages: LMMessage[],
  model: string = DEFAULT_MODEL,
  temperature: number = DEFAULT_TEMPERATURE
): Promise<LMStudioReply> {
  const url = `${BASE_URL}/v1/chat/completions`;

  const body = {
    model,
    messages,
    temperature,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Meteor.Error(
      "lmstudio-error",
      `LM Studio Error ${response.status}: ${text}`
    );
  }

  const data = (await response.json()) as LMChatResponse;

  const content =
    data?.choices?.[0]?.message?.content ??
    "(LM Studio returned empty content)";

  return {
    content,
    raw: data,
  };
}
