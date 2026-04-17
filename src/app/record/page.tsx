"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, Send, RotateCcw } from "lucide-react";
import Link from "next/link";
import RecordButton from "@/components/RecordButton";
import SentimentCard from "@/components/SentimentCard";
import CrisisBanner from "@/components/CrisisBanner";

type Phase = "idle" | "recording" | "recorded" | "transcribing" | "analyzing" | "done";

const MOCK_RESULT = {
  sentiment: "NEGATIVE" as const,
  sentimentScore: 0.72,
  wellbeingScore: 4.2,
  topics: ["Trabajo", "Estrés", "Familia", "Incertidumbre"],
  aiSummary: "Noto que estás cargando bastante peso en este momento, especialmente relacionado con el trabajo y la dinámica familiar. Es completamente válido sentirse agotado ante tanta presión simultánea. Recuerda que expresar estos sentimientos ya es un primer paso valioso.",
  riskLevel: "LOW" as "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
};

export default function RecordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [text, setText] = useState("");
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === "recording") {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleMicClick = () => {
    if (phase === "idle") { setPhase("recording"); setSeconds(0); }
    else if (phase === "recording") { setPhase("recorded"); }
  };

  const handleAnalyze = async () => {
    setPhase("transcribing");
    await new Promise(r => setTimeout(r, 1500));
    setPhase("analyzing");
    await new Promise(r => setTimeout(r, 2000));
    setResult(MOCK_RESULT);
    setPhase("done");
  };

  const handleReset = () => { setPhase("idle"); setSeconds(0); setText(""); setResult(null); };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 pt-24">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#6C63FF]/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#FF6B9D]/10 blur-3xl" />
      </div>

      {/* Nav */}
      <div className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">MindEcho</span>
          </Link>
          <Link href="/sign-up" className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
            Guardar historial →
          </Link>
        </div>
      </div>

      <div className="w-full max-w-2xl mt-8 flex flex-col items-center gap-8">
        {phase === "done" && (result?.riskLevel === "HIGH" || result?.riskLevel === "CRITICAL") && <CrisisBanner />}

        {phase !== "done" && (
          <>
            <div className="text-center animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">
                {phase === "idle" && "¿Cómo te sientes hoy?"}
                {phase === "recording" && "Escuchándote..."}
                {phase === "recorded" && "Grabación lista"}
                {phase === "transcribing" && "Transcribiendo..."}
                {phase === "analyzing" && "Analizando..."}
              </h1>
              <p className="text-slate-400 text-sm">
                {phase === "idle" && "Presiona el micrófono y habla libremente. No hay respuestas incorrectas."}
                {phase === "recording" && "Habla con calma. Presiona para detener cuando termines."}
                {phase === "recorded" && "Tu audio está listo. Presiona Analizar cuando quieras."}
                {(phase === "transcribing" || phase === "analyzing") && "La IA está procesando tu registro..."}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <RecordButton
                isRecording={phase === "recording"}
                onClick={handleMicClick}
                disabled={phase === "transcribing" || phase === "analyzing"}
              />
              {(phase === "recording" || phase === "recorded") && (
                <div className={`text-2xl font-mono font-bold tabular-nums ${phase === "recording" ? "text-red-400" : "text-slate-400"}`}>
                  {formatTime(seconds)}
                </div>
              )}
              {(phase === "transcribing" || phase === "analyzing") && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  {phase === "transcribing" ? "Transcribiendo audio..." : "Analizando sentimientos..."}
                </div>
              )}
            </div>

            <div className="w-full">
              <p className="text-center text-xs text-slate-600 mb-3">— O escribe aquí (opcional) —</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="También puedes escribir cómo te sientes..."
                disabled={phase === "recording" || phase === "transcribing" || phase === "analyzing"}
                rows={4}
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50 resize-none disabled:opacity-40 transition-colors"
              />
            </div>

            {(phase === "recorded" || (phase === "idle" && text.trim())) && (
              <button
                onClick={handleAnalyze}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_30px_rgba(108,99,255,0.4)] animate-fade-in"
              >
                <Send className="w-4 h-4" /> Analizar
              </button>
            )}
          </>
        )}

        {phase === "done" && result && (
          <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Tu análisis está listo</h1>
              <p className="text-sm text-slate-400">Aquí está la reflexión de hoy</p>
            </div>
            <SentimentCard {...result} />
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-full glass-card text-slate-300 text-sm font-medium hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Nuevo registro
              </button>
              <Link
                href="/sign-up"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Guardar y ver evolución →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
