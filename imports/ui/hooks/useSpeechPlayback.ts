import { useCallback, useEffect, useState } from "react";

export const useSpeechPlayback = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;

    setIsSupported(supported);

    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (messageId: string, text: string) => {
      if (!isSupported || !text.trim()) {
        return;
      }

      if (speakingId === messageId) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setSpeakingId((current) => (current === messageId ? null : current));
      };
      utterance.onerror = () => {
        setSpeakingId((current) => (current === messageId ? null : current));
      };

      setSpeakingId(messageId);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, speakingId]
  );

  return {
    isSupported,
    speakingId,
    speak,
  };
};
