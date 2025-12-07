import { useEffect } from "react";
import { Meteor } from "meteor/meteor";

import { ChatSession } from "../types/session";

export const useThreadBootstrap = (
  userName: string,
  chats: ChatSession[],
  setChats: (updater: ChatSession[] | ((current: ChatSession[]) => ChatSession[])) => void
) => {
  useEffect(() => {
    if (!userName || !chats.length) return;

    const missingThread = chats.some((chat) => !chat.threadId);
    if (!missingThread) return;

    const ensureThreads = async () => {
      const withThreads: ChatSession[] = [];

      for (const chat of chats) {
        if (chat.threadId) {
          withThreads.push(chat);
          continue;
        }

        try {
          const threadId = (await Meteor.callAsync(
            "chats.create",
            chat.title || "Conversation"
          )) as string;

          withThreads.push({ ...chat, threadId });
        } catch (error) {
          console.error("Failed to create LM Studio thread", error);
          withThreads.push(chat);
        }
      }

      setChats(withThreads);
    };

    void ensureThreads();
  }, [userName, chats, setChats]);
};
