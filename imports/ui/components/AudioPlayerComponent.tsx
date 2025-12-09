import React from "react";

interface AudioPlayerComponentProps {
  align?: "left" | "right";
  title?: string;
  subtitle?: string;
  isPlaying: boolean;
  onToggle: () => void;
  timestamp?: string;
  disabled?: boolean;
}

export const AudioPlayerComponent: React.FC<AudioPlayerComponentProps> = ({
  align = "left",
  title = "Voice playback",
  subtitle,
  isPlaying,
  onToggle,
  timestamp,
  disabled,
}) => {
  const isSent = align === "right";
  const bubbleColors = isSent
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-white text-gray-900 border-gray-200";
  const metaTone = isSent ? "text-blue-100" : "text-gray-500";

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-sm rounded-2xl px-4 py-3 shadow border message-bubble ${bubbleColors}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">
              {title}
            </p>
            {subtitle && (
              <p className={`text-[11px] ${metaTone}`}>{subtitle}</p>
            )}
          </div>
          {timestamp && <span className={`text-[10px] ${metaTone}`}>{timestamp}</span>}
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`w-full rounded-xl px-3 py-2 text-sm font-semibold transition border ${
            isPlaying
              ? isSent
                ? "bg-white text-blue-700 border-white"
                : "bg-blue-50 text-blue-700 border-blue-200"
              : isSent
                ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
          } disabled:opacity-60`}
          aria-pressed={isPlaying}
        >
          {isPlaying ? "Stop voice" : "Play voice"}
        </button>
      </div>
    </div>
  );
};
