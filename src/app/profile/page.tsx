"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Save, Loader2, CheckCircle, User } from "lucide-react";
import NavBar from "@/components/NavBar";

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
  { value: "EMPLOYED_FULL", label: "Empleado(a) tiempo completo" }, { value: "EMPLOYED_PART", label: "Empleado(a) tiempo parcial" },
  { value: "SELF_EMPLOYED", label: "Independiente / Freelance" }, { value: "UNEMPLOYED", label: "Desempleado(a)" },
  { value: "STUDENT", label: "Estudiante" }, { value: "RETIRED", label: "Jubilado(a)" },
  { value: "UNABLE_TO_WORK", label: "Sin capacidad de trabajar" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];
const maritalOptions = [
  { value: "SINGLE", label: "Soltero(a)" }, { value: "IN_RELATIONSHIP", label: "En relación" },
  { value: "MARRIED", label: "Casado(a)" }, { value: "DIVORCED", label: "Divorciado(a)" },
  { value: "WIDOWED", label: "Viudo(a)" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];

type FormData = {
  displayName: string;
  ageRange: string; genderIdentity: string; genderOther: string;
  country: string; region: string; educationLevel: string;
  employmentStatus: string; maritalStatus: string;
  hasPriorDiagnosis: string; consentResearch: boolean;
};

function SelectGrid({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value === value ? "" : opt.value)}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useUser();
  const [form, setForm] = useState<FormData>({
    displayName: "",
    ageRange: "", genderIdentity: "", genderOther: "",
    country: "", region: "", educationLevel: "",
    employmentStatus: "", maritalStatus: "",
    hasPriorDiagnosis: "", consentResearch: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        const s = data.sociodemographic;
        setForm({
          displayName: data.displayName ?? "",
          ageRange: s?.ageRange ?? "",
          genderIdentity: s?.genderIdentity ?? "",
          genderOther: s?.genderOther ?? "",
          country: s?.country ?? "",
          region: s?.region ?? "",
          educationLevel: s?.educationLevel ?? "",
          employmentStatus: s?.employmentStatus ?? "",
          maritalStatus: s?.maritalStatus ?? "",
          hasPriorDiagnosis: s?.hasPriorDiagnosis === true ? "SI" : s?.hasPriorDiagnosis === false ? "NO" : "",
          consentResearch: s?.consentResearch ?? false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormData, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        ...form,
        hasPriorDiagnosis: form.hasPriorDiagnosis === "SI" ? true : form.hasPriorDiagnosis === "NO" ? false : null,
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 pt-24 pb-16">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-[#6C63FF]/10 blur-3xl" />
          <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[#FF6B9D]/8 blur-3xl" />
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center flex-shrink-0">
              {user?.imageUrl
                ? <img src={user.imageUrl} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover" />
                : <User className="w-7 h-7 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.fullName ?? "Mi perfil"}</h1>
              <p className="text-slate-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <div className="space-y-5">
            <Section title="Nombre de usuario">
              <p className="text-xs text-slate-500 mb-3">Así te llamaremos en tu panel de evolución. Si lo dejas vacío usaremos tu nombre de Clerk.</p>
              <input
                type="text"
                placeholder="Ej: Eduardo, Edu, Lalo..."
                value={form.displayName}
                onChange={e => set("displayName", e.target.value)}
                maxLength={40}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
              />
            </Section>

            <Section title="Información personal">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Rango de edad</label>
                  <SelectGrid options={ageRanges} value={form.ageRange} onChange={v => set("ageRange", v)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Identidad de género</label>
                  <SelectGrid options={genderOptions} value={form.genderIdentity} onChange={v => set("genderIdentity", v)} />
                  {form.genderIdentity === "OTHER" && (
                    <input type="text" placeholder="¿Cómo te identificas?" value={form.genderOther}
                      onChange={e => set("genderOther", e.target.value)}
                      className="mt-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[{ key: "country", label: "País", ph: "Ej: México" }, { key: "region", label: "Región / Estado", ph: "Ej: CDMX" }].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">{f.label}</label>
                      <input type="text" placeholder={f.ph}
                        value={(form as Record<string, unknown>)[f.key] as string}
                        onChange={e => set(f.key as keyof FormData, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50" />
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Situación actual">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Nivel educativo</label>
                  <SelectGrid options={educationLevels} value={form.educationLevel} onChange={v => set("educationLevel", v)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Situación laboral</label>
                  <SelectGrid options={employmentOptions} value={form.employmentStatus} onChange={v => set("employmentStatus", v)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Estado civil</label>
                  <SelectGrid options={maritalOptions} value={form.maritalStatus} onChange={v => set("maritalStatus", v)} />
                </div>
              </div>
            </Section>

            <Section title="Salud mental">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">¿Tienes diagnóstico previo de salud mental?</label>
                  <SelectGrid
                    options={[{ value: "SI", label: "Sí" }, { value: "NO", label: "No" }, { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" }]}
                    value={form.hasPriorDiagnosis}
                    onChange={v => set("hasPriorDiagnosis", v)}
                  />
                </div>
              </div>
            </Section>

            <Section title="Privacidad e investigación">
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                Al activar esta opción, tus datos anonimizados contribuirán a investigaciones sobre salud mental poblacional. Nunca se compartirá información que te identifique.
              </p>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => set("consentResearch", !form.consentResearch)}
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all duration-200 ${form.consentResearch ? "bg-[#6C63FF] border-[#6C63FF]" : "border-white/20 bg-white/5"}`}>
                  {form.consentResearch && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                  Acepto que mis datos anonimizados sean usados para investigación
                </span>
              </label>
            </Section>

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold text-base hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saving ? "Guardando..." : saved ? "¡Cambios guardados!" : "Guardar preferencias"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
