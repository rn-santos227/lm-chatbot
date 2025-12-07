export interface Message {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  threadId?: string;
  title: string;
  messages: Message[];
}
