import { Meteor } from "meteor/meteor";
import fetch from "node-fetch";

import { LMMessage, LMChatResponse } from "./types";

const lm = Meteor.settings.lmstudio;

export async function lmChat(messages: LMMessage[]): Promise<string> {
  const response = await fetch(`${lm.base}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: lm.model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LM Studio Error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as LMChatResponse;
  return data.choices?.[0]?.message?.content ?? "";
}
