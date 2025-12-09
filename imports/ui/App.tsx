import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isLmStudioConnected, setIsLmStudioConnected] = useState<
    boolean | null
  >(null);
  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  const {
    chats,
    activeChat,
    activeChatId,
    isProcessing,
    processingStatus,
    isHistoryLoading,
    canLoadMoreHistory,
    setActiveChatId,
    handleNewChat,
    sendMessage,
    analyzeFile,
    loadOlderMessages,
    removeChat,
  } = useChatSessions(userName, (error) => {
    console.error("LM Studio request failed", error);
    setIsLmStudioConnected(false);
    setToast({
      message:
        "Lost connection to LM Studio. The app is locked until connection is restored.",
      type: "error",
    });
  });

  const isLocked = useMemo(
    () => isLmStudioConnected === false,
    [isLmStudioConnected]
  );

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const ok = await Meteor.callAsync("lmstudio.health");
      setIsLmStudioConnected(ok);
      setToast({
        message: ok
          ? "Connected to LM Studio"
          : "LM Studio unreachable. The app is locked until connection is restored.",
        type: ok ? "success" : "error",
      });
    } catch (error) {
      console.error("LM Studio health check failed", error);
      setIsLmStudioConnected(false);
      setToast({
        message:
          "Unable to verify LM Studio connection. The app is locked until it is restored.",
        type: "error",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

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
    if (isLocked) {
      setToast({
        message: "Connect to LM Studio to continue chatting.",
        type: "error",
      });
      return;
    }

    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput("");
  };

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  const handleOpenNewChatModal = () => {
    if (isLocked) {
      setToast({
        message: "Cannot create chats until LM Studio is reachable.",
        type: "error",
      });
      return;
    }

    setPendingChatTitle(`Chat ${chats.length + 1}`);
    setShowNewChatModal(true);
  };

  const handleCreateChat = (title: string) => {
    if (isLocked) {
      setToast({
        message: "Cannot create chats until LM Studio is reachable.",
        type: "error",
      });
      return;
    }
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
          onDeleteChat={removeChat}
          onNewChat={handleOpenNewChatModal}
          onEditName={() => setShowNameModal(true)}
          isLocked={isLocked}
          onRetryConnection={checkConnection}
          isCheckingConnection={isCheckingConnection}
        />

        <MainLayout
          userName={userName}
          activeChat={activeChat}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSendMessage={handleSendMessage}
          onAnalyzeFile={analyzeFile}
          isProcessing={isProcessing}
          processingStatus={processingStatus}
          isHistoryLoading={isHistoryLoading}
          canLoadMoreHistory={canLoadMoreHistory}
          onLoadOlderMessages={loadOlderMessages}
          isLocked={isLocked}
          onRetryConnection={checkConnection}
          isCheckingConnection={isCheckingConnection}
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
