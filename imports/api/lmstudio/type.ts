export interface LMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LMChatChoice {
  index: number;
  message: LMMessage;
  finish_reason: string;
}

export interface LMChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: LMChatChoice[];
}