"use client";
import { Mic, Square } from "lucide-react";

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function RecordButton({ isRecording, onClick, disabled }: RecordButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <>
          <span className="absolute w-32 h-32 rounded-full bg-[#6C63FF]/20 animate-ping" style={{ animationDuration: "1.2s" }} />
          <span className="absolute w-40 h-40 rounded-full bg-[#6C63FF]/10 animate-ping" style={{ animationDuration: "1.8s" }} />
        </>
      )}
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#6C63FF]/50 ${
          isRecording
            ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110"
            : "bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] shadow-[0_0_40px_rgba(108,99,255,0.4)] hover:scale-105"
        }`}
      >
        {isRecording
          ? <Square className="w-8 h-8 text-white fill-white" />
          : <Mic className="w-9 h-9 text-white" />
        }
      </button>
    </div>
  );
}
