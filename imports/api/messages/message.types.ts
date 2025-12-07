
import { LMChatResponse } from "../lmstudio/lmstudio.types";
export interface MessageDoc {
  _id?: string;
  threadId: string;
  sender: "user" | "assistant";
  content: string;
  raw?: LMChatResponse;
  createdAt: Date;
}
