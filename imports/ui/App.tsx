import React, { useEffect, useState } from "react";
import { Meteor } from "meteor/meteor";

import { SideBarLayout } from "./layouts/SideBarLayout";
import { NameModal } from "./components/NameModal";
import { NewChatModal } from "./components/NewChatModal";
import { MainLayout } from "./layouts/MainLayout";
import { useChatSessions } from "./hooks/useChatSessions";
import { Toast } from "./components/Toast";

export const App = () => {
  const [userName, setUserName] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [pendingChatTitle, setPendingChatTitle] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const {
    chats,
    activeChat,
    activeChatId,
    isProcessing,
    setActiveChatId,
    handleNewChat,
    sendMessage,
  } = useChatSessions(userName);

  useEffect(() => {
    const storedName = localStorage.getItem("chat-username") || "";
    setUserName(storedName);
    setPendingName(storedName);

    if (!storedName) {
      setShowNameModal(true);
    }
  }, []);

  const handleSaveName = () => {
    if (!pendingName.trim()) return;

    const trimmed = pendingName.trim();
    setUserName(trimmed);
    localStorage.setItem("chat-username", trimmed);
    setShowNameModal(false);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput("");
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const ok = await Meteor.callAsync("lmstudio.health");
        setToast({
          message: ok
            ? "Connected to LM Studio"
            : "LM Studio unreachable. Messages may fail.",
          type: ok ? "success" : "error",
        });
      } catch (error) {
        console.error("LM Studio health check failed", error);
        setToast({
          message: "Unable to verify LM Studio connection.",
          type: "error",
        });
      }
    };

    void checkConnection();
  }, []);

  const handleOpenNewChatModal = () => {
    setPendingChatTitle(`Chat ${chats.length + 1}`);
    setShowNewChatModal(true);
  };

  const handleCreateChat = (title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) return;

    handleNewChat(trimmedTitle);
    setShowNewChatModal(false);
    setPendingChatTitle("");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex h-screen max-h-screen overflow-hidden">
        <SideBarLayout
          userName={userName}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleOpenNewChatModal}
          onEditName={() => setShowNameModal(true)}
        />

        <MainLayout
          userName={userName}
          activeChat={activeChat}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>

      <NameModal
        isOpen={showNameModal}
        pendingName={pendingName}
        onChangeName={setPendingName}
        onClose={() => setShowNameModal(false)}
        onSave={handleSaveName}
      />
      <NewChatModal
        isOpen={showNewChatModal}
        chatTitle={pendingChatTitle}
        onChangeTitle={setPendingChatTitle}
        onClose={() => setShowNewChatModal(false)}
        onCreate={handleCreateChat}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
