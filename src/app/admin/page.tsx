"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { Users, AlertTriangle, Heart, TrendingUp, Plus, X, Check, ToggleLeft, ToggleRight, Loader2, History, UserCircle, Globe, Flame, Calendar, Mic, Trash2 } from "lucide-react";
import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/nextjs";

const TOOLTIP_STYLE = { background: "#1E1E3A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" };

const genderLabels: Record<string, string> = {
  WOMAN_CIS: "Mujer cis", MAN_CIS: "Hombre cis", WOMAN_TRANS: "Mujer trans",
  MAN_TRANS: "Hombre trans", NON_BINARY: "No binario", GENDER_FLUID: "Género fluido",
  AGENDER: "Agénero", OTHER: "Otro", PREFER_NOT_TO_SAY: "No indica", UNKNOWN: "Sin dato",
};
const ageLabels: Record<string, string> = {
  UNDER_18: "<18", AGE_18_25: "18-25", AGE_26_35: "26-35", AGE_36_45: "36-45",
  AGE_46_55: "46-55", AGE_56_65: "56-65", OVER_65: ">65", PREFER_NOT_TO_SAY: "No indica", UNKNOWN: "Sin dato",
};
const employmentLabels: Record<string, string> = {
  EMPLOYED_FULL: "Empleado", EMPLOYED_PART: "Parcial", SELF_EMPLOYED: "Independiente",
  UNEMPLOYED: "Desempleado", STUDENT: "Estudiante", RETIRED: "Jubilado",
  UNABLE_TO_WORK: "Sin cap.", PREFER_NOT_TO_SAY: "No indica", UNKNOWN: "Sin dato",
};
const typeLabels: Record<string, string> = {
  SUICIDE_IDEATION: "Ideación suicida", DOMESTIC_VIOLENCE: "Violencia doméstica",
  ANXIETY_CRISIS: "Crisis de ansiedad", SUBSTANCE_ABUSE: "Sustancias",
  IDENTITY_CRISIS: "Crisis de identidad", GENERAL: "General",
};
const channelLabels: Record<string, string> = { PHONE: "Teléfono", WHATSAPP: "WhatsApp", CHAT_ONLINE: "Chat online", EMAIL: "Email", SOCIAL_MEDIA: "Redes Sociales" };

type Resource = { id: number; name: string; country: string; type: string; channel: string; contact: string; schedule: string; isFree: boolean; isActive: boolean };
const initialResources: Resource[] = [
  { id: 1, name: "Línea de la Vida", country: "México", type: "SUICIDE_IDEATION", channel: "PHONE", contact: "800 911 2000", schedule: "24/7", isFree: true, isActive: true },
  { id: 2, name: "Chat de Crisis", country: "Global", type: "GENERAL", channel: "CHAT_ONLINE", contact: "crisischat.org", schedule: "24/7", isFree: true, isActive: true },
];

type PersonalEntry = { id: string; createdAt: string; sentiment: string | null; wellbeingScore: number | null; topics: string[] };
type PersonalStats = { avgWellbeing: number; totalEntries: number; sentimentCounts: Record<string, number>; topTopics: string[]; streak: number };

const sentimentBadge: Record<string, string> = {
  VERY_POSITIVE: "bg-emerald-400/20 text-emerald-400", POSITIVE: "bg-green-400/20 text-green-400",
  NEUTRAL: "bg-slate-400/20 text-slate-400", NEGATIVE: "bg-amber-400/20 text-amber-400",
  VERY_NEGATIVE: "bg-red-400/20 text-red-400",
};
const sentimentLabel: Record<string, string> = {
  VERY_POSITIVE: "Muy positivo", POSITIVE: "Positivo", NEUTRAL: "Neutro",
  NEGATIVE: "Negativo", VERY_NEGATIVE: "Muy negativo",
};

type Period = "week" | "month" | "quarter" | "year" | "custom";

function getDateRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (period === "custom") return { from: customFrom, to: customTo };
  const days = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 365;
  const from = new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semana", month: "Mes", quarter: "Trimestre", year: "Año", custom: "Personalizado",
};

export default function AdminPage() {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<"personal" | "admin">("admin");
  const [tab, setTab] = useState<"overview" | "population" | "crisis" | "alerts" | "history">("overview");
  const [profileHistory, setProfileHistory] = useState<{ id: string; field: string; oldValue: string | null; newValue: string | null; changedAt: string; userId: string }[]>([]);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newResource, setNewResource] = useState({ name: "", country: "", type: "GENERAL", channel: "PHONE", contact: "", schedule: "24/7", isFree: true });
  const [personalEntries, setPersonalEntries] = useState<PersonalEntry[]>([]);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [personalDisplayName, setPersonalDisplayName] = useState<string | null>(null);
  const [personalLoading, setPersonalLoading] = useState(false);

  // Period selector
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(() => new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchAdminData = (p: Period, cf: string, ct: string) => {
    setLoading(true);
    const { from, to } = getDateRange(p, cf, ct);
    const url = `/api/admin?from=${from}&to=${to}`;
    fetch(url)
      .then(async r => {
        if (r.status === 403) { setForbidden(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData(period, customFrom, customTo);
    fetch("/api/admin/profile-history")
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setProfileHistory(d); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (p !== "custom") fetchAdminData(p, customFrom, customTo);
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) fetchAdminData("custom", customFrom, customTo);
  };

  const handleViewModeSwitch = (mode: "personal" | "admin") => {
    setViewMode(mode);
    if (mode === "personal" && personalStats === null && !personalLoading) {
      setPersonalLoading(true);
      fetch("/api/dashboard")
        .then(r => r.json())
        .then(d => {
          setPersonalEntries(d.entries ?? []);
          setPersonalStats(d.stats ?? null);
          setPersonalDisplayName(d.displayName ?? null);
        })
        .finally(() => setPersonalLoading(false));
    }
  };

  const emptyResource = { name: "", country: "", type: "GENERAL", channel: "PHONE", contact: "", schedule: "24/7", isFree: true };

  const openAdd = () => { setEditingId(null); setNewResource(emptyResource); setShowModal(true); };
  const openEdit = (r: Resource) => { setEditingId(r.id); setNewResource({ name: r.name, country: r.country, type: r.type, channel: r.channel, contact: r.contact, schedule: r.schedule, isFree: r.isFree }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingId(null); setNewResource(emptyResource); };

  const handleSaveResource = () => {
    if (!newResource.name || !newResource.contact) return;
    if (editingId !== null) {
      setResources(prev => prev.map(r => r.id === editingId ? { ...r, ...newResource } : r));
    } else {
      setResources(prev => [...prev, { ...newResource, id: Date.now(), isActive: true }]);
    }
    closeModal();
  };
  const toggleResource = (id: number) => setResources(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  const deleteResource = (id: number) => { if (confirm("¿Eliminar este recurso? Esta acción no se puede deshacer.")) setResources(prev => prev.filter(r => r.id !== id)); };

  const tabs = [
    { key: "overview", label: "Visión general" },
    { key: "population", label: "Población" },
    { key: "crisis", label: "Recursos de crisis" },
    { key: "alerts", label: "Alertas de riesgo" },
    { key: "history", label: "Historial de perfiles" },
  ] as const;

  const overview = (data?.overview as Record<string, number>) ?? {};
  const sentimentTrend = (data?.sentimentTrend as unknown[]) ?? [];
  const wellbeingByGender = ((data?.wellbeingByGender as { name: string; score: number; count: number }[]) ?? [])
    .map(d => ({ ...d, name: genderLabels[d.name] ?? d.name }));
  const wellbeingByAge = ((data?.wellbeingByAge as { name: string; score: number; count: number }[]) ?? [])
    .map(d => ({ ...d, name: ageLabels[d.name] ?? d.name }));
  const wellbeingByEmployment = ((data?.wellbeingByEmployment as { name: string; score: number; count: number }[]) ?? [])
    .map(d => ({ ...d, name: employmentLabels[d.name] ?? d.name }));
  const riskEntries = (data?.riskEntries as { risk: string; keywords: string[]; country: string; time: string }[]) ?? [];
  const recentAnonymous = (data?.recentAnonymous as { id: string; createdAt: string; sentiment: string | null; wellbeingScore: number | null; topics: string[]; sociodemographicId: string | null }[]) ?? [];

  if (forbidden) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Acceso denegado</h1>
            <p className="text-slate-400 text-sm">No tienes permisos de administrador. Contacta al equipo si crees que esto es un error.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 pt-24 pb-16">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-[#6C63FF]/8 blur-3xl" />
          <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[#FF6B9D]/6 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                {viewMode === "personal" ? `Mi evolución` : "Panel de Administración"}
              </h1>
              <p className="text-slate-400 text-sm">
                {viewMode === "personal" ? "Tu progreso emocional personal" : "Datos anonimizados de toda la población"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex items-center glass-card rounded-xl p-1">
                <button
                  onClick={() => handleViewModeSwitch("personal")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${viewMode === "personal" ? "bg-[#6C63FF]/30 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <UserCircle className="w-4 h-4" /> Mi evolución
                </button>
                <button
                  onClick={() => handleViewModeSwitch("admin")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${viewMode === "admin" ? "bg-[#6C63FF]/30 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Globe className="w-4 h-4" /> Administración
                </button>
              </div>
              {viewMode === "admin" && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En vivo
                </span>
              )}
            </div>
          </div>

          {/* Personal view */}
          {viewMode === "personal" && (
            <div className="animate-fade-in">
              {personalLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin" />
                </div>
              ) : personalStats ? (
                <div className="space-y-6">
                  {/* Personal KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Bienestar promedio", value: personalStats.avgWellbeing.toFixed(1), sub: "/10", icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400" },
                      { label: "Registros totales", value: String(personalStats.totalEntries), sub: "en total", icon: <Calendar className="w-4 h-4" />, color: "text-[#6C63FF]" },
                      { label: "Racha actual", value: String(personalStats.streak), sub: personalStats.streak === 1 ? "día" : "días", icon: <Flame className="w-4 h-4" />, color: "text-orange-400" },
                      { label: "Tema frecuente", value: personalStats.topTopics[0] ?? "—", sub: "más mencionado", icon: <Mic className="w-4 h-4" />, color: "text-[#FF6B9D]" },
                    ].map((kpi, i) => (
                      <div key={i} className="glass-card rounded-2xl p-4">
                        <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}<span className="text-sm text-slate-500 font-normal ml-1">{kpi.sub}</span></p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Wellbeing trend */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Puntaje de bienestar — últimos registros</h2>
                    {personalEntries.filter(e => e.wellbeingScore !== null).length > 1 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={personalEntries.filter(e => e.wellbeingScore !== null).slice(0, 30).reverse().map((e, i) => ({ day: `${i + 1}`, score: e.wellbeingScore }))}
                          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                          <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94A3B8" }} itemStyle={{ color: "#6C63FF" }} />
                          <Line type="monotone" dataKey="score" stroke="#6C63FF" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#6C63FF" }} name="Bienestar" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Necesitas más registros para ver la tendencia</div>
                    )}
                  </div>
                  {/* Recent entries */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Últimos registros</h2>
                    <div className="space-y-3">
                      {personalEntries.slice(0, 5).map(entry => (
                        <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {entry.sentiment && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentBadge[entry.sentiment]}`}>
                                  {sentimentLabel[entry.sentiment]}
                                </span>
                              )}
                              <span className="text-xs text-slate-600">
                                {new Date(entry.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              {entry.topics.map(t => (
                                <span key={t} className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                          </div>
                          {entry.wellbeingScore !== null && (
                            <div className="text-right flex-shrink-0">
                              <span className="text-lg font-bold text-white">{entry.wellbeingScore.toFixed(1)}</span>
                              <p className="text-xs text-slate-600">/10</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500 text-sm">No hay registros personales aún</div>
              )}
            </div>
          )}

          {/* Admin view */}
          {viewMode === "admin" && <>
            <div className="flex gap-1 glass-card rounded-2xl p-1 mb-4 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${tab === t.key ? "bg-[#6C63FF]/30 text-white" : "text-slate-400 hover:text-white"}`}>
                  {t.label}
                  {t.key === "alerts" && riskEntries.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-500/30 text-red-400">{riskEntries.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Period selector — applies to all charts */}
            {tab !== "crisis" && tab !== "history" && (
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex gap-1 glass-card rounded-xl p-1">
                  {(["week", "month", "quarter", "year", "custom"] as Period[]).map(p => (
                    <button key={p} onClick={() => handlePeriodChange(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${period === p ? "bg-[#6C63FF]/40 text-white" : "text-slate-400 hover:text-white"}`}>
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
                {period === "custom" && (
                  <div className="flex items-center gap-2">
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]/50 cursor-pointer" />
                    <span className="text-slate-600 text-xs">→</span>
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]/50 cursor-pointer" />
                    <button onClick={handleCustomApply}
                      className="px-4 py-1.5 rounded-xl bg-[#6C63FF]/30 border border-[#6C63FF]/40 text-xs text-white hover:bg-[#6C63FF]/50 transition-all cursor-pointer">
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            )}
          </>}

          {viewMode === "admin" && (loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin" />
                <p className="text-slate-400 text-sm">Cargando datos poblacionales...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview */}
              {tab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Registros totales", value: String(overview.totalEntries ?? 0), icon: <Heart className="w-4 h-4" />, color: "text-[#FF6B9D]" },
                      { label: "Bienestar promedio", value: `${overview.avgWellbeing ?? 0}/10`, icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400" },
                      { label: "Usuarios anónimos", value: String(overview.anonymousEntries ?? 0), icon: <Users className="w-4 h-4" />, color: "text-[#6C63FF]" },
                      { label: "Alertas de riesgo", value: String(overview.riskAlerts ?? 0), icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
                    ].map((kpi, i) => (
                      <div key={i} className="glass-card rounded-2xl p-4">
                        <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
                      </div>
                    ))}
                  </div>
                  {sentimentTrend.length > 0 ? (
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="text-sm font-semibold text-slate-300 mb-4">
                        Tendencia de sentimientos — {period === "custom" ? `${customFrom} → ${customTo}` : `último ${PERIOD_LABELS[period].toLowerCase()}`}
                        {data?.granularity === "week" && <span className="ml-2 text-slate-600 font-normal text-xs">(agrupado por semana)</span>}
                        {data?.granularity === "month" && <span className="ml-2 text-slate-600 font-normal text-xs">(agrupado por mes)</span>}
                      </h2>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={sentimentTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} />
                          <Line type="monotone" dataKey="positive" stroke="#10B981" strokeWidth={2} dot={false} name="Positivo" />
                          <Line type="monotone" dataKey="neutral" stroke="#64748B" strokeWidth={2} dot={false} name="Neutro" />
                          <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={2} dot={false} name="Negativo" />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 mt-2 justify-center">
                        {[{ c: "#10B981", l: "Positivo" }, { c: "#64748B", l: "Neutro" }, { c: "#EF4444", l: "Negativo" }].map(item => (
                          <div key={item.l} className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: item.c }} />
                            <span className="text-xs text-slate-500">{item.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card rounded-2xl p-6 flex items-center justify-center h-48 text-slate-600 text-sm">
                      Se necesitan más registros para mostrar tendencias
                    </div>
                  )}

                  {/* Recent anonymous entries */}
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-slate-300">Registros anónimos recientes</h2>
                      <span className="text-xs text-slate-500">{overview.anonymousEntries ?? 0} en total</span>
                    </div>
                    {recentAnonymous.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500 border-b border-white/5">
                              <th className="text-left pb-2 font-medium">Fecha y hora</th>
                              <th className="text-left pb-2 font-medium">Sentimiento</th>
                              <th className="text-left pb-2 font-medium">Bienestar</th>
                              <th className="text-left pb-2 font-medium">Temas</th>
                              <th className="text-left pb-2 font-medium">Demograf.</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {recentAnonymous.map(e => (
                              <tr key={e.id} className="text-xs">
                                <td className="py-2.5 text-slate-400 pr-4 whitespace-nowrap">
                                  {new Date(e.createdAt).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td className="py-2.5 pr-4">
                                  {e.sentiment ? (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      e.sentiment === "VERY_POSITIVE" ? "bg-emerald-400/20 text-emerald-400" :
                                      e.sentiment === "POSITIVE" ? "bg-green-400/20 text-green-400" :
                                      e.sentiment === "NEUTRAL" ? "bg-slate-400/20 text-slate-400" :
                                      e.sentiment === "NEGATIVE" ? "bg-amber-400/20 text-amber-400" :
                                      "bg-red-400/20 text-red-400"
                                    }`}>
                                      {{ VERY_POSITIVE: "Muy positivo", POSITIVE: "Positivo", NEUTRAL: "Neutro", NEGATIVE: "Negativo", VERY_NEGATIVE: "Muy negativo" }[e.sentiment] ?? e.sentiment}
                                    </span>
                                  ) : <span className="text-slate-600">—</span>}
                                </td>
                                <td className="py-2.5 pr-4">
                                  {e.wellbeingScore !== null
                                    ? <span className="font-semibold text-white">{e.wellbeingScore.toFixed(1)}<span className="text-slate-600 font-normal">/10</span></span>
                                    : <span className="text-slate-600">—</span>}
                                </td>
                                <td className="py-2.5 pr-4 text-slate-400 max-w-[160px] truncate">
                                  {e.topics.length > 0 ? e.topics.slice(0, 3).join(", ") : <span className="text-slate-600">—</span>}
                                </td>
                                <td className="py-2.5">
                                  {e.sociodemographicId
                                    ? <span className="text-emerald-400 font-medium">✓ Vinculados</span>
                                    : <span className="text-slate-600">Sin datos</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm">No hay registros anónimos aún</p>
                    )}
                  </div>
                </div>
              )}

              {/* Population */}
              {tab === "population" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-sm text-slate-300 flex items-center justify-between flex-wrap gap-2">
                    <span>Todos los datos son 100% anonimizados. No se muestra ningún identificador personal.</span>
                    <span className="text-xs text-[#6C63FF] font-medium">
                      {period === "custom" ? `${customFrom} → ${customTo}` : `Último ${PERIOD_LABELS[period].toLowerCase()} · ${overview.totalEntries ?? 0} registros`}
                    </span>
                  </div>
                  {[
                    { title: "Bienestar por identidad de género", data: wellbeingByGender },
                    { title: "Bienestar por rango de edad", data: wellbeingByAge },
                    { title: "Bienestar por situación laboral", data: wellbeingByEmployment },
                  ].map(chart => (
                    <div key={chart.title} className="glass-card rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{chart.title}</h2>
                        <span className="text-xs text-slate-600">{period === "custom" ? `${customFrom} → ${customTo}` : `Último ${PERIOD_LABELS[period].toLowerCase()}`}</span>
                      </div>
                      {chart.data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={chart.data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(108,99,255,0.05)" }} />
                            <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Bienestar">
                              {chart.data.map((_, i) => <Cell key={i} fill={`hsl(${250 + i * 20}, 65%, ${55 + i * 3}%)`} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                          Sin datos sociodemográficos aún
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Crisis resources */}
              {tab === "crisis" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-400">{resources.length} recursos configurados</p>
                    <button onClick={openAdd}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                      <Plus className="w-4 h-4" /> Agregar recurso
                    </button>
                  </div>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          {["Nombre", "País", "Tipo", "Canal", "Contacto", "Horario", "Estado", ""].map((h, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map(r => (
                          <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                            <td className="px-4 py-3 text-slate-400">{r.country}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-[#6C63FF]/20 text-[#6C63FF]">{typeLabels[r.type]}</span></td>
                            <td className="px-4 py-3 text-slate-400">{channelLabels[r.channel] ?? r.channel}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.contact}</td>
                            <td className="px-4 py-3 text-slate-400">{r.schedule}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => toggleResource(r.id)} className="cursor-pointer" aria-label="Toggle activo">
                                {r.isActive ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => openEdit(r)} aria-label="Editar recurso"
                                  className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                                  Editar
                                </button>
                                <button onClick={() => deleteResource(r.id)} aria-label="Eliminar recurso"
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                      <div className="bg-[#0F0F2A] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
                        <div className="flex items-center justify-between mb-5">
                          <h2 className="text-lg font-bold text-white">
                            {editingId !== null ? "Editar recurso de crisis" : "Agregar recurso de crisis"}
                          </h2>
                          <button onClick={closeModal} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-3">
                          {[{ label: "Nombre", key: "name", placeholder: "Ej: Línea de la Vida" }, { label: "País", key: "country", placeholder: "Ej: México" }, { label: "Contacto", key: "contact", placeholder: "Ej: 800 911 2000" }, { label: "Horario", key: "schedule", placeholder: "Ej: 24/7" }].map(f => (
                            <div key={f.key}>
                              <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                              <input type="text" placeholder={f.placeholder}
                                value={(newResource as Record<string, unknown>)[f.key] as string}
                                onChange={e => setNewResource(prev => ({ ...prev, [f.key]: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#6C63FF]/60" />
                            </div>
                          ))}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                              <select value={newResource.type} onChange={e => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none cursor-pointer">
                                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#0F0F2A]">{v}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Canal</label>
                              <select value={newResource.channel} onChange={e => setNewResource(prev => ({ ...prev, channel: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white focus:outline-none cursor-pointer">
                                {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#0F0F2A]">{v}</option>)}
                              </select>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <div onClick={() => setNewResource(prev => ({ ...prev, isFree: !prev.isFree }))}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${newResource.isFree ? "bg-[#6C63FF] border-[#6C63FF]" : "border-white/30 bg-white/10"}`}>
                              {newResource.isFree && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="text-sm text-slate-300">Servicio gratuito</span>
                          </label>
                        </div>
                        <div className="flex gap-3 mt-5">
                          <button onClick={closeModal} className="flex-1 py-2.5 rounded-full bg-white/10 border border-white/15 text-sm text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer">Cancelar</button>
                          <button onClick={handleSaveResource} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-semibold hover:opacity-90 cursor-pointer">
                            {editingId !== null ? "Guardar cambios" : "Agregar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile history */}
              {tab === "history" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-[#6C63FF]/10 border border-[#6C63FF]/20">
                    <History className="w-4 h-4 text-[#6C63FF] flex-shrink-0" />
                    <p className="text-sm text-slate-300">Historial de cambios en preferencias de usuario. Los IDs son internos — no se expone información personal.</p>
                  </div>
                  {profileHistory.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center text-slate-600 text-sm">No hay cambios registrados aún</div>
                  ) : (
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            {["Usuario (ID)", "Campo", "Valor anterior", "Valor nuevo", "Fecha"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {profileHistory.map(entry => (
                            <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.userId.slice(0, 8)}…</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">{entry.field}</span></td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{entry.oldValue ?? <span className="italic text-slate-600">vacío</span>}</td>
                              <td className="px-4 py-3 text-white text-xs font-medium">{entry.newValue ?? <span className="italic text-slate-600">vacío</span>}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{new Date(entry.changedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Risk alerts */}
              {tab === "alerts" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">Datos completamente anonimizados. Sin información personal identificable.</p>
                  </div>
                  {riskEntries.length === 0 ? (
                    <div className="glass-card rounded-2xl p-8 text-center text-slate-600 text-sm">No hay alertas de riesgo registradas</div>
                  ) : (
                    <div className="space-y-3">
                      {riskEntries.map((alert, i) => (
                        <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${alert.risk === "CRITICAL" ? "bg-red-500/30 text-red-400" : "bg-orange-500/30 text-orange-400"}`}>
                            {alert.risk}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              {alert.keywords.map(k => (
                                <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">"{k}"</span>
                              ))}
                            </div>
                            <p className="text-xs text-slate-500">
                              {alert.country} · {new Date(alert.time).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ))}
        </div>
      </main>
    </>
  );
}
