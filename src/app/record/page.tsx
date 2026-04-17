"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, AlertCircle } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/nextjs";
import RecordButton from "@/components/RecordButton";
import SentimentCard from "@/components/SentimentCard";
import CrisisBanner from "@/components/CrisisBanner";

type Phase = "idle" | "recording" | "recorded" | "transcribing" | "analyzing" | "done" | "error";
type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type SentimentLevel = "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";

interface AnalysisResult {
  sentiment: SentimentLevel;
  sentimentScore: number;
  wellbeingScore: number;
  emotionCategories: string[];
  topics: string[];
  riskLevel: RiskLevel;
  riskKeywords: string[];
  aiSummary: string;
}

function getSessionToken(): string {
  const key = "mindecho_session";
  let token = sessionStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem(key, token);
  }
  return token;
}

export default function RecordPage() {
  const { isSignedIn } = useUser();
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [text, setText] = useState("");
  const [transcription, setTranscription] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        audioBlobRef.current = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        setPhase("recorded");
      };
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setPhase("recording");
      setSeconds(0);
    } catch {
      setErrorMsg("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
      setPhase("error");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const handleMicClick = () => {
    if (phase === "idle" || phase === "error") startRecording();
    else if (phase === "recording") stopRecording();
  };

  const handleAnalyze = async () => {
    setErrorMsg("");
    const hasAudio = !!(audioBlobRef.current && audioBlobRef.current.size > 0 && seconds > 0);
    const hasText = text.trim().length > 0;

    if (!hasAudio && !hasText) {
      setErrorMsg("Graba audio o escribe algo antes de analizar.");
      return;
    }

    let finalText = text.trim();
    let savedTranscription = "";

    if (hasAudio) {
      setPhase("transcribing");
      try {
        const formData = new FormData();
        formData.append("audio", audioBlobRef.current!, "audio.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Error en transcripción");
        const data = await res.json();
        savedTranscription = typeof data.transcription === "string" ? data.transcription.trim() : "";
        if (!savedTranscription && !hasText) {
          setErrorMsg("No se detectó voz en el audio. Intenta hablar más cerca del micrófono o escribe tu mensaje.");
          setPhase("recorded");
          return;
        }
        finalText = (savedTranscription + (text.trim() ? `\n\n${text.trim()}` : "")).trim();
        setTranscription(savedTranscription);
      } catch {
        if (!hasText) {
          // No fallback — nothing to analyze
          setErrorMsg("No se pudo transcribir el audio. Intenta escribir tu mensaje.");
          setPhase("recorded");
          return;
        }
        // Has text typed — fall through to text-only analysis
        setErrorMsg("No se pudo transcribir el audio. Analizando tu texto escrito...");
      }
    }

    if (!finalText.trim()) {
      setErrorMsg("No hay texto suficiente para analizar.");
      setPhase(hasAudio ? "recorded" : "idle");
      return;
    }

    setPhase("analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText }),
      });
      if (!res.ok) throw new Error("Error en análisis");
      const analysis: AnalysisResult = await res.json();
      setResult(analysis);

      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: getSessionToken(),
          mode: hasAudio && savedTranscription ? (hasText ? "BOTH" : "VOICE") : "TEXT",
          transcription: savedTranscription || null,
          textContent: text.trim() || null,
          ...analysis,
        }),
      });

      setPhase("done");
    } catch {
      setErrorMsg("No se pudo completar el análisis. Intenta de nuevo.");
      setPhase(audioBlobRef.current ? "recorded" : "idle");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setSeconds(0);
    setText("");
    setTranscription("");
    setResult(null);
    setErrorMsg("");
    audioBlobRef.current = null;
  };

  const statusText: Partial<Record<Phase, { title: string; subtitle: string }>> = {
    idle:        { title: "¿Cómo te sientes hoy?", subtitle: "Presiona el micrófono y habla libremente. No hay respuestas incorrectas." },
    recording:   { title: "Escuchándote...", subtitle: "Habla con calma. Presiona para detener cuando termines." },
    recorded:    { title: "Grabación lista", subtitle: transcription ? `"${transcription.slice(0, 80)}${transcription.length > 80 ? "..." : ""}"` : "Tu audio está listo. Presiona Analizar cuando quieras." },
    transcribing:{ title: "Transcribiendo...", subtitle: "Convirtiendo tu voz a texto con Whisper AI..." },
    analyzing:   { title: "Analizando...", subtitle: "La IA está evaluando tu bienestar emocional..." },
    error:       { title: "Algo salió mal", subtitle: errorMsg },
  };

  const current = statusText[phase];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 pt-24">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#6C63FF]/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#FF6B9D]/10 blur-3xl" />
      </div>

      <NavBar />

      <div className="w-full max-w-2xl mt-8 flex flex-col items-center gap-8">
        {/* Crisis banner for high risk */}
        {phase === "done" && result && (result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") && (
          <CrisisBanner />
        )}

        {phase !== "done" && (
          <>
            {current && (
              <div className="text-center animate-fade-in">
                <h1 className="text-3xl font-bold text-white mb-2">{current.title}</h1>
                <p className={`text-sm max-w-md ${phase === "error" ? "text-red-400" : "text-slate-400"}`}>
                  {current.subtitle}
                </p>
              </div>
            )}

            {/* Error message */}
            {errorMsg && phase !== "error" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

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
                  {phase === "transcribing" ? "Transcribiendo con Whisper AI..." : "Analizando con Claude AI..."}
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

            {(phase === "recorded" || (phase === "idle" && text.trim().length > 0) || (phase === "error" && text.trim().length > 0)) && (
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
            {transcription && (
              <div className="w-full glass-card rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Transcripción</p>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{transcription}"</p>
              </div>
            )}
            <SentimentCard {...result} />
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-full glass-card text-slate-300 text-sm font-medium hover:text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Nuevo registro
              </button>
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isSignedIn ? "Ver mi evolución →" : "Guardar y ver evolución →"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
