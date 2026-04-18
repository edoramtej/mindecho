"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, AlertCircle, RefreshCw, ChevronRight } from "lucide-react";
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

type SocioForm = {
  ageRange: string;
  genderIdentity: string;
  genderOther: string;
  country: string;
  region: string;
  educationLevel: string;
  employmentStatus: string;
  maritalStatus: string;
  hasPriorDiagnosis: string;
  consentResearch: boolean;
};

const ageRanges = [
  { value: "UNDER_18", label: "Menor de 18" }, { value: "AGE_18_25", label: "18-25" },
  { value: "AGE_26_35", label: "26-35" }, { value: "AGE_36_45", label: "36-45" },
  { value: "AGE_46_55", label: "46-55" }, { value: "AGE_56_65", label: "56-65" },
  { value: "OVER_65", label: "Más de 65" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];
const genderOptions = [
  { value: "WOMAN_CIS", label: "Mujer cisgénero" }, { value: "MAN_CIS", label: "Hombre cisgénero" },
  { value: "WOMAN_TRANS", label: "Mujer transgénero" }, { value: "MAN_TRANS", label: "Hombre transgénero" },
  { value: "NON_BINARY", label: "No binario / No binaria" }, { value: "GENDER_FLUID", label: "Género fluido" },
  { value: "AGENDER", label: "Agénero" }, { value: "OTHER", label: "Otro" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];
const educationLevels = [
  { value: "NO_FORMAL", label: "Sin estudios formales" }, { value: "PRIMARY", label: "Primaria" },
  { value: "SECONDARY", label: "Secundaria" }, { value: "TECHNICAL", label: "Técnico / Vocacional" },
  { value: "UNDERGRADUATE", label: "Universitario" }, { value: "POSTGRADUATE", label: "Posgrado" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];
const employmentOptions = [
  { value: "EMPLOYED_FULL", label: "Empleado(a) tiempo completo" }, { value: "EMPLOYED_PART", label: "Tiempo parcial" },
  { value: "SELF_EMPLOYED", label: "Independiente / Freelance" }, { value: "UNEMPLOYED", label: "Desempleado(a)" },
  { value: "STUDENT", label: "Estudiante" }, { value: "RETIRED", label: "Jubilado(a)" },
  { value: "UNABLE_TO_WORK", label: "Sin capacidad de trabajar" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];
const maritalOptions = [
  { value: "SINGLE", label: "Soltero(a)" }, { value: "IN_RELATIONSHIP", label: "En relación" },
  { value: "MARRIED", label: "Casado(a)" }, { value: "DIVORCED", label: "Divorciado(a)" },
  { value: "WIDOWED", label: "Viudo(a)" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];

function SelectGrid({ options, value, onChange, required }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value === value ? (required ? opt.value : "") : opt.value)}
          className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50 ${
            value === opt.value
              ? "bg-[#6C63FF]/30 border border-[#6C63FF] text-white font-medium"
              : "bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function getSessionToken(): string {
  const key = "mindecho_session";
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function getAnonSocioId(): string | null {
  return localStorage.getItem("mindecho_socio_id");
}

function setAnonSocioId(id: string) {
  localStorage.setItem("mindecho_socio_id", id);
}

export default function RecordPage() {
  const { isSignedIn, isLoaded } = useUser();
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

  // Anonymous onboarding modal
  const [showSocioModal, setShowSocioModal] = useState(false);
  const [socioSaving, setSocioSaving] = useState(false);
  const [socioError, setSocioError] = useState("");
  const [socioForm, setSocioForm] = useState<SocioForm>({
    ageRange: "", genderIdentity: "", genderOther: "",
    country: "", region: "", educationLevel: "",
    employmentStatus: "", maritalStatus: "",
    hasPriorDiagnosis: "", consentResearch: false,
  });

  // Show modal for anonymous users who haven't filled sociodemographic data
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn && !getAnonSocioId()) {
      setShowSocioModal(true);
    }
  }, [isLoaded, isSignedIn]);

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
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? "";
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
        audioBlobRef.current = new Blob(audioChunksRef.current, { type: actualType });
        stream.getTracks().forEach(t => t.stop());
        setPhase("recorded");
      };
      mediaRecorder.start(500);
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

  const handleReRecord = async () => {
    audioBlobRef.current = null;
    audioChunksRef.current = [];
    setSeconds(0);
    setTranscription("");
    setErrorMsg("");
    await startRecording();
  };

  const handleSocioSubmit = async () => {
    setSocioError("");
    if (!socioForm.ageRange || !socioForm.genderIdentity || !socioForm.country) {
      setSocioError("Completa los campos obligatorios: rango de edad, identidad de género y país.");
      return;
    }
    if (!socioForm.consentResearch) {
      setSocioError("Debes aceptar el consentimiento de investigación para continuar.");
      return;
    }
    setSocioSaving(true);
    try {
      const sessionToken = getSessionToken();
      const res = await fetch("/api/sociodemographic/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          ...socioForm,
          hasPriorDiagnosis: socioForm.hasPriorDiagnosis === "SI" ? true : socioForm.hasPriorDiagnosis === "NO" ? false : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setAnonSocioId(data.id);
      setShowSocioModal(false);
    } catch (err) {
      setSocioError(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.");
    } finally {
      setSocioSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setErrorMsg("");
    const hasAudio = !!(audioBlobRef.current && audioBlobRef.current.size > 0);
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
        const blobType = audioBlobRef.current!.type;
        const ext = blobType.includes("ogg") ? "ogg" : blobType.includes("mp4") ? "mp4" : "webm";
        const formData = new FormData();
        formData.append("audio", audioBlobRef.current!, `audio.${ext}`);
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Error en transcripción");
        savedTranscription = typeof data.transcription === "string" ? data.transcription.trim() : "";
        if (!savedTranscription && !hasText) {
          setErrorMsg("No se detectó voz en el audio. Intenta hablar más cerca del micrófono o escribe tu mensaje.");
          setPhase("recorded");
          return;
        }
        finalText = (savedTranscription + (text.trim() ? `\n\n${text.trim()}` : "")).trim();
        setTranscription(savedTranscription);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "No se pudo transcribir el audio.";
        if (!hasText) {
          setErrorMsg(msg);
          setPhase("recorded");
          return;
        }
        setErrorMsg(`${msg} Analizando tu texto escrito...`);
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

      const sessionToken = getSessionToken();
      const sociodemographicId = !isSignedIn ? getAnonSocioId() : null;

      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          sociodemographicId,
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

      {/* Anonymous sociodemographic modal */}
      {showSocioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0F0F2A] border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 pb-4 border-b border-white/10 sticky top-0 bg-[#0F0F2A] rounded-t-3xl">
              <h2 className="text-xl font-bold text-white mb-1">Antes de continuar</h2>
              <p className="text-sm text-slate-400">
                Tu participación ayuda a investigar el bienestar mental de forma anónima. Completa los siguientes datos para continuar.
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Age range — required */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 uppercase tracking-wide">
                  Rango de edad <span className="text-[#FF6B9D]">*</span>
                </label>
                <SelectGrid required options={ageRanges} value={socioForm.ageRange}
                  onChange={v => setSocioForm(f => ({ ...f, ageRange: v }))} />
              </div>

              {/* Gender — required */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 uppercase tracking-wide">
                  Identidad de género <span className="text-[#FF6B9D]">*</span>
                </label>
                <SelectGrid required options={genderOptions} value={socioForm.genderIdentity}
                  onChange={v => setSocioForm(f => ({ ...f, genderIdentity: v }))} />
                {socioForm.genderIdentity === "OTHER" && (
                  <input type="text" placeholder="¿Cómo te identificas?" value={socioForm.genderOther}
                    onChange={e => setSocioForm(f => ({ ...f, genderOther: e.target.value }))}
                    className="mt-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50" />
                )}
              </div>

              {/* Country — required */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 uppercase tracking-wide">
                  País <span className="text-[#FF6B9D]">*</span>
                </label>
                <input type="text" placeholder="Ej: México" value={socioForm.country}
                  onChange={e => setSocioForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50" />
              </div>

              {/* Region — optional */}
              <div>
                <label className="text-xs text-slate-400 mb-2 uppercase tracking-wide block">Región / Estado <span className="text-slate-600 normal-case">(opcional)</span></label>
                <input type="text" placeholder="Ej: CDMX" value={socioForm.region}
                  onChange={e => setSocioForm(f => ({ ...f, region: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50" />
              </div>

              {/* Education — optional */}
              <div>
                <label className="text-xs text-slate-400 mb-2 uppercase tracking-wide block">Nivel educativo <span className="text-slate-600 normal-case">(opcional)</span></label>
                <SelectGrid options={educationLevels} value={socioForm.educationLevel}
                  onChange={v => setSocioForm(f => ({ ...f, educationLevel: v }))} />
              </div>

              {/* Employment — optional */}
              <div>
                <label className="text-xs text-slate-400 mb-2 uppercase tracking-wide block">Situación laboral <span className="text-slate-600 normal-case">(opcional)</span></label>
                <SelectGrid options={employmentOptions} value={socioForm.employmentStatus}
                  onChange={v => setSocioForm(f => ({ ...f, employmentStatus: v }))} />
              </div>

              {/* Marital — optional */}
              <div>
                <label className="text-xs text-slate-400 mb-2 uppercase tracking-wide block">Estado civil <span className="text-slate-600 normal-case">(opcional)</span></label>
                <SelectGrid options={maritalOptions} value={socioForm.maritalStatus}
                  onChange={v => setSocioForm(f => ({ ...f, maritalStatus: v }))} />
              </div>

              {/* Prior diagnosis — optional */}
              <div>
                <label className="text-xs text-slate-400 mb-2 uppercase tracking-wide block">¿Diagnóstico previo de salud mental? <span className="text-slate-600 normal-case">(opcional)</span></label>
                <SelectGrid
                  options={[{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" }]}
                  value={socioForm.hasPriorDiagnosis}
                  onChange={v => setSocioForm(f => ({ ...f, hasPriorDiagnosis: v }))}
                />
              </div>

              {/* Consent — required */}
              <div className="p-4 rounded-2xl bg-[#6C63FF]/10 border border-[#6C63FF]/20">
                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                  Tus datos serán usados de forma completamente anónima para investigación sobre salud mental poblacional. Nunca se compartirá información que te identifique.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div onClick={() => setSocioForm(f => ({ ...f, consentResearch: !f.consentResearch }))}
                    className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-200 cursor-pointer ${socioForm.consentResearch ? "bg-[#6C63FF] border-[#6C63FF]" : "border-white/20 bg-white/5"}`}>
                    {socioForm.consentResearch && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-slate-300 leading-relaxed">
                    Acepto que mis datos anonimizados sean usados para investigación <span className="text-[#FF6B9D]">*</span>
                  </span>
                </label>
              </div>

              {socioError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {socioError}
                </div>
              )}

              <p className="text-xs text-slate-600 text-center">Los campos marcados con <span className="text-[#FF6B9D]">*</span> son obligatorios</p>

              <button onClick={handleSocioSubmit} disabled={socioSaving}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                {socioSaving ? "Guardando..." : <><span>Continuar</span> <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {phase === "recorded" && (
                <button
                  onClick={handleReRecord}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Volver a grabar
                </button>
              )}
              {(phase === "transcribing" || phase === "analyzing") && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#6C63FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  {phase === "transcribing" ? "Transcribiendo con Whisper AI..." : "Analizando tu bienestar emocional..."}
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
