export type LMRole = "system" | "user" | "assistant";
export interface LMMessage {
  role: LMRole;
  content: string;
}
