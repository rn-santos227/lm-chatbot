import type { UploadedFile } from "./file";

export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  displayText?: string;
  attachments?: UploadedFile[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  threadId?: string;
  title: string;
  messages: Message[];
  hasMore?: boolean;
  oldestTimestamp?: number | null;
  hasLoadedInitial?: boolean;
}
