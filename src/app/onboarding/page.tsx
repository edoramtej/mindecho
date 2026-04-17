"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, SkipForward, Brain } from "lucide-react";
import Link from "next/link";

const ageRanges = ["Menor de 18", "18-25", "26-35", "36-45", "46-55", "56-65", "Más de 65", "Prefiero no decir"];
const genderOptions = ["Mujer cisgénero", "Hombre cisgénero", "Mujer transgénero", "Hombre transgénero", "No binario / No binaria", "Género fluido", "Agénero", "Otro", "Prefiero no decir"];
const educationLevels = ["Sin estudios formales", "Primaria", "Secundaria", "Técnico / Vocacional", "Universitario", "Posgrado", "Prefiero no decir"];
const employmentOptions = ["Empleado(a) tiempo completo", "Empleado(a) tiempo parcial", "Independiente / Freelance", "Desempleado(a)", "Estudiante", "Jubilado(a)", "Sin capacidad de trabajar", "Prefiero no decir"];
const maritalOptions = ["Soltero(a)", "En relación", "Casado(a)", "Divorciado(a)", "Viudo(a)", "Prefiero no decir"];
const diagnosisOptions = ["Sí", "No", "Prefiero no decir"];

type FormData = {
  ageRange: string; genderIdentity: string; genderOther: string;
  country: string; region: string; educationLevel: string;
  employmentStatus: string; maritalStatus: string;
  hasPriorDiagnosis: string; consentResearch: boolean;
};

function SelectGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50 ${
            value === opt
              ? "bg-[#6C63FF]/30 border border-[#6C63FF] text-white font-medium"
              : "bg-white/5 border border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    ageRange: "", genderIdentity: "", genderOther: "",
    country: "", region: "", educationLevel: "",
    employmentStatus: "", maritalStatus: "",
    hasPriorDiagnosis: "", consentResearch: false,
  });

  const set = (key: keyof FormData, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const handleNext = () => step < 2 ? setStep(2) : router.push("/record");
  const handleSkip = () => router.push("/record");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-[#6C63FF]/15 blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[#FF6B9D]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">MindEcho</span>
          </Link>
          <button onClick={handleSkip} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <SkipForward className="w-4 h-4" /> Saltar
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D]" : "bg-white/10"}`} />
          ))}
        </div>

        <div className="glass-card rounded-3xl p-8 animate-fade-in">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Cuéntanos un poco sobre ti</h1>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Esta información es opcional pero nos ayuda a entender mejor la salud mental de distintas comunidades. Todo es anónimo.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Rango de edad</label>
                  <SelectGrid options={ageRanges} value={form.ageRange} onChange={(v) => set("ageRange", v)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Identidad de género</label>
                  <SelectGrid options={genderOptions} value={form.genderIdentity} onChange={(v) => set("genderIdentity", v)} />
                  {form.genderIdentity === "Otro" && (
                    <input
                      type="text"
                      placeholder="¿Cómo te identificas?"
                      value={form.genderOther}
                      onChange={(e) => set("genderOther", e.target.value)}
                      className="mt-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">País</label>
                    <input
                      type="text"
                      placeholder="Ej: México"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Región / Estado</label>
                    <input
                      type="text"
                      placeholder="Ej: CDMX"
                      value={form.region}
                      onChange={(e) => set("region", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Nivel educativo</label>
                  <SelectGrid options={educationLevels} value={form.educationLevel} onChange={(v) => set("educationLevel", v)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Situación laboral</label>
                  <SelectGrid options={employmentOptions} value={form.employmentStatus} onChange={(v) => set("employmentStatus", v)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Estado civil</label>
                  <SelectGrid options={maritalOptions} value={form.maritalStatus} onChange={(v) => set("maritalStatus", v)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">¿Tienes diagnóstico previo de salud mental?</label>
                  <SelectGrid options={diagnosisOptions} value={form.hasPriorDiagnosis} onChange={(v) => set("hasPriorDiagnosis", v)} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Consentimiento de investigación</h1>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Tus respuestas podrían contribuir a investigaciones sobre salud mental poblacional.
              </p>
              <div className="space-y-4 mb-6">
                {[
                  "Tus datos siempre estarán anonimizados — nunca incluirán tu nombre ni información identificable.",
                  "Solo se usarán estadísticas agregadas (ej: '40% de usuarios reportan ansiedad').",
                  "Puedes retirar tu consentimiento en cualquier momento desde tu perfil.",
                  "Los resultados pueden usarse para informar políticas de salud pública.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                    <div className="w-5 h-5 rounded-full bg-[#6C63FF]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-[#6C63FF] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div
                  onClick={() => set("consentResearch", !form.consentResearch)}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-200 ${form.consentResearch ? "bg-[#6C63FF] border-[#6C63FF]" : "border-white/20 bg-white/5"}`}
                >
                  {form.consentResearch && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                  Acepto que mis datos anonimizados sean utilizados para investigación sobre salud mental poblacional.
                </span>
              </label>
              <p className="text-xs text-slate-600 mt-3">
                Si no aceptas, tus registros solo se usarán para tu análisis personal y no contribuirán al pool de investigación.
              </p>
            </>
          )}

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            ) : <div />}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              {step === 2 ? "Comenzar" : "Siguiente"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
