"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { Users, AlertTriangle, Heart, TrendingUp, Plus, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import NavBar from "@/components/NavBar";

const sentimentTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`, positive: 30 + Math.random() * 20, neutral: 20 + Math.random() * 10, negative: 20 + Math.random() * 20,
}));
const byGender = [
  { name: "Mujer cis", score: 5.2 }, { name: "Hombre cis", score: 5.8 }, { name: "No binario", score: 4.9 },
  { name: "Trans", score: 4.5 }, { name: "Otro", score: 5.1 },
];
const byAge = [
  { name: "18-25", score: 4.8 }, { name: "26-35", score: 5.4 }, { name: "36-45", score: 5.9 },
  { name: "46-55", score: 6.1 }, { name: "56-65", score: 6.4 },
];
const byEmployment = [
  { name: "Empleado", score: 5.7 }, { name: "Desempleado", score: 4.1 }, { name: "Estudiante", score: 5.0 },
  { name: "Independiente", score: 5.5 }, { name: "Jubilado", score: 6.8 },
];

const initialResources = [
  { id: 1, name: "Línea de la Vida", country: "México", type: "SUICIDE_IDEATION", channel: "PHONE", contact: "800 911 2000", schedule: "24/7", isFree: true, isActive: true },
  { id: 2, name: "Chat de Crisis", country: "Global", type: "GENERAL", channel: "CHAT_ONLINE", contact: "crisischat.org", schedule: "24/7", isFree: true, isActive: true },
  { id: 3, name: "Línea Mujer", country: "Chile", type: "DOMESTIC_VIOLENCE", channel: "PHONE", contact: "1455", schedule: "24/7", isFree: true, isActive: true },
];

const riskAlerts = [
  { id: 1, time: "Hace 5 min", risk: "CRITICAL", keywords: ["ideación", "sin esperanza"], country: "México" },
  { id: 2, time: "Hace 23 min", risk: "HIGH", keywords: ["no puedo más", "rendirse"], country: "Colombia" },
  { id: 3, time: "Hace 1h", risk: "HIGH", keywords: ["soledad extrema", "oscuridad"], country: "Argentina" },
  { id: 4, time: "Hace 2h", risk: "CRITICAL", keywords: ["daño", "escape"], country: "España" },
];

type Resource = typeof initialResources[0];

const typeLabels: Record<string, string> = {
  SUICIDE_IDEATION: "Ideación suicida", DOMESTIC_VIOLENCE: "Violencia doméstica",
  ANXIETY_CRISIS: "Crisis de ansiedad", SUBSTANCE_ABUSE: "Sustancias",
  IDENTITY_CRISIS: "Crisis de identidad", GENERAL: "General",
};
const channelLabels: Record<string, string> = { PHONE: "Teléfono", WHATSAPP: "WhatsApp", CHAT_ONLINE: "Chat online", EMAIL: "Email" };

const TOOLTIP_STYLE = { background: "#1E1E3A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "11px" };

export default function AdminPage() {
  const [tab, setTab] = useState<"overview" | "population" | "crisis" | "alerts">("overview");
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [showModal, setShowModal] = useState(false);
  const [newResource, setNewResource] = useState({ name: "", country: "", type: "GENERAL", channel: "PHONE", contact: "", schedule: "24/7", isFree: true });

  const tabs = [
    { key: "overview", label: "Visión general" },
    { key: "population", label: "Población" },
    { key: "crisis", label: "Recursos de crisis" },
    { key: "alerts", label: "Alertas de riesgo" },
  ] as const;

  const handleAddResource = () => {
    if (!newResource.name || !newResource.contact) return;
    setResources(prev => [...prev, { ...newResource, id: Date.now(), isActive: true }]);
    setShowModal(false);
    setNewResource({ name: "", country: "", type: "GENERAL", channel: "PHONE", contact: "", schedule: "24/7", isFree: true });
  };

  const toggleResource = (id: number) => setResources(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

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
              <h1 className="text-3xl font-bold text-white mb-1">Panel de Administración</h1>
              <p className="text-slate-400 text-sm">Salud mental poblacional en tiempo real</p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En vivo
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 glass-card rounded-2xl p-1 mb-8 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${tab === t.key ? "bg-[#6C63FF]/30 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {t.label}
                {t.key === "alerts" && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-500/30 text-red-400">4</span>}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Registros totales", value: "1,847", icon: <Heart className="w-4 h-4" />, color: "text-[#FF6B9D]" },
                  { label: "Bienestar promedio", value: "5.4/10", icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400" },
                  { label: "Alertas hoy", value: "12", icon: <AlertTriangle className="w-4 h-4" />, color: "text-red-400" },
                  { label: "Usuarios activos", value: "342", icon: <Users className="w-4 h-4" />, color: "text-[#6C63FF]" },
                ].map((kpi, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4">
                    <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
                  </div>
                ))}
              </div>
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-slate-300 mb-4">Tendencia de sentimientos — últimos 14 días</h2>
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
            </div>
          )}

          {/* Population */}
          {tab === "population" && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-3">
                {["Fecha", "País", "Edad", "Género"].map(f => (
                  <select key={f} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 focus:outline-none focus:border-[#6C63FF]/50 cursor-pointer">
                    <option>Filtrar por {f}</option>
                  </select>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Bienestar por identidad de género", data: byGender },
                  { title: "Bienestar por rango de edad", data: byAge },
                  { title: "Bienestar por situación laboral", data: byEmployment },
                ].map((chart) => (
                  <div key={chart.title} className="glass-card rounded-2xl p-6">
                    <h2 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wide">{chart.title}</h2>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={chart.data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(108,99,255,0.05)" }} />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Bienestar">
                          {chart.data.map((_, i) => <Cell key={i} fill={`hsl(${250 + i * 15}, 70%, ${55 + i * 5}%)`} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
              <div className="glass-card rounded-2xl p-6 flex items-center justify-center h-48 border-dashed border-2 border-white/10">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p className="text-sm text-slate-400">Mapa de calor geográfico</p>
                  <p className="text-xs text-slate-600">Integración con Mapbox próximamente</p>
                </div>
              </div>
            </div>
          )}

          {/* Crisis Resources */}
          {tab === "crisis" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-400">{resources.length} recursos configurados</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agregar recurso
                </button>
              </div>
              <div className="glass-card rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Nombre", "País", "Tipo", "Canal", "Contacto", "Horario", "Estado"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-slate-400">{r.country}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-[#6C63FF]/20 text-[#6C63FF]">{typeLabels[r.type]}</span></td>
                        <td className="px-4 py-3 text-slate-400">{channelLabels[r.channel]}</td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.contact}</td>
                        <td className="px-4 py-3 text-slate-400">{r.schedule}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleResource(r.id)} className="cursor-pointer transition-colors" aria-label="Toggle estado">
                            {r.isActive
                              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                              : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="glass-card rounded-3xl p-6 w-full max-w-md animate-fade-in">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-white">Agregar recurso de crisis</h2>
                      <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Nombre del recurso", key: "name", placeholder: "Ej: Línea de la Vida" },
                        { label: "País", key: "country", placeholder: "Ej: México" },
                        { label: "Contacto (tel/url)", key: "contact", placeholder: "Ej: 800 911 2000" },
                        { label: "Horario", key: "schedule", placeholder: "Ej: 24/7" },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                          <input
                            type="text"
                            placeholder={f.placeholder}
                            value={(newResource as Record<string,unknown>)[f.key] as string}
                            onChange={e => setNewResource(prev => ({ ...prev, [f.key]: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#6C63FF]/50"
                          />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Tipo de situación</label>
                          <select value={newResource.type} onChange={e => setNewResource(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none cursor-pointer">
                            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Canal</label>
                          <select value={newResource.channel} onChange={e => setNewResource(prev => ({ ...prev, channel: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none cursor-pointer">
                            {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setNewResource(prev => ({ ...prev, isFree: !prev.isFree }))}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${newResource.isFree ? "bg-[#6C63FF] border-[#6C63FF]" : "border-white/20 bg-white/5"}`}>
                          {newResource.isFree && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-sm text-slate-300">Servicio gratuito</span>
                      </label>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-full glass-card text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">Cancelar</button>
                      <button onClick={handleAddResource} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">Guardar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk Alerts */}
          {tab === "alerts" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">Los datos mostrados son completamente anonimizados. Sin información personal identificable.</p>
              </div>
              <div className="space-y-3">
                {riskAlerts.map((alert) => (
                  <div key={alert.id} className="glass-card rounded-2xl p-4 flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${alert.risk === "CRITICAL" ? "bg-red-500/30 text-red-400" : "bg-orange-500/30 text-orange-400"}`}>
                      {alert.risk}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {alert.keywords.map(k => (
                          <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-slate-300">"{k}"</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">{alert.country} · {alert.time}</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl text-xs bg-[#6C63FF]/20 text-[#6C63FF] hover:bg-[#6C63FF]/30 transition-colors cursor-pointer flex-shrink-0">
                      Ver recursos
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
