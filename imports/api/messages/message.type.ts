export interface MessageDoc {
  _id?: string;
  threadId: string;
  sender: "user" | "assistant";
  content: string;
  raw?: string;
  createdAt: Date;
}
