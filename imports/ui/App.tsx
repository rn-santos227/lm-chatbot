import React, { useEffect, useState } from "react";
import SidebarLayout from "./layouts/SidebarLayout";
import NameModal from "./components/NameModal";
import NewChatModal from "./components/NewChatModal";
import MainLayout from "./layouts/MainLayout";
import { useChatSessions } from "./hooks/useChatSessions";

export const App: React.FC  = () => {
  const [userName, setUserName] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [pendingChatTitle, setPendingChatTitle] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const { chats, activeChat, activeChatId, setActiveChatId, handleNewChat, sendMessage } =
    useChatSessions(userName);

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

  const handleOpenNewChatModal = () => {
    setPendingChatTitle(`Chat ${chats.length + 1}`);
    setShowNewChatModal(true);
  };

  const handleCreateChat = () => {
    handleNewChat();
    setShowNewChatModal(false);
    setPendingChatTitle("");
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <div className="flex h-screen max-h-screen overflow-hidden">
        <SidebarLayout
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
    </div>
  );
};
