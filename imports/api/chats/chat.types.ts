export interface ChatThread {
  _id?: string;
  userId?: string;

  title: string;
  summary?: string;

  model?: string;
  temperature?: number;

  createdAt: Date;
  updatedAt: Date;
}
