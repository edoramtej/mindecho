"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Mic, TrendingUp, Flame, Calendar } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/NavBar";

const wellbeingData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  score: parseFloat((4 + Math.sin(i * 0.4) * 2.5 + Math.random() * 1.5).toFixed(1)),
}));

const sentimentData = [
  { name: "Positivo", value: 28, color: "#10B981" },
  { name: "Neutro", value: 22, color: "#64748B" },
  { name: "Negativo", value: 35, color: "#F59E0B" },
  { name: "Muy negativo", value: 15, color: "#EF4444" },
];

const recentEntries = [
  { date: "Hoy, 9:14am", sentiment: "NEGATIVE", topics: ["Trabajo", "Estrés"], score: 4.2 },
  { date: "Ayer, 8:30pm", sentiment: "POSITIVE", topics: ["Familia", "Gratitud"], score: 7.8 },
  { date: "Hace 2 días", sentiment: "NEUTRAL", topics: ["Rutina", "Cansancio"], score: 5.5 },
  { date: "Hace 3 días", sentiment: "POSITIVE", topics: ["Logro", "Trabajo"], score: 7.1 },
  { date: "Hace 4 días", sentiment: "VERY_NEGATIVE", topics: ["Ansiedad", "Incertidumbre"], score: 2.8 },
];

const topTopics = ["Trabajo", "Familia", "Estrés", "Ansiedad", "Gratitud", "Rutina", "Salud", "Relaciones"];

const sentimentBadge: Record<string, string> = {
  VERY_POSITIVE: "bg-emerald-400/20 text-emerald-400",
  POSITIVE: "bg-green-400/20 text-green-400",
  NEUTRAL: "bg-slate-400/20 text-slate-400",
  NEGATIVE: "bg-amber-400/20 text-amber-400",
  VERY_NEGATIVE: "bg-red-400/20 text-red-400",
};
const sentimentLabel: Record<string, string> = {
  VERY_POSITIVE: "Muy positivo", POSITIVE: "Positivo",
  NEUTRAL: "Neutro", NEGATIVE: "Negativo", VERY_NEGATIVE: "Muy negativo",
};

export default function DashboardPage() {
  const avgScore = (wellbeingData.reduce((a, b) => a + b.score, 0) / wellbeingData.length).toFixed(1);

  return (
    <>
      <NavBar isLoggedIn />
      <main className="min-h-screen px-4 pt-24 pb-16">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-[#6C63FF]/10 blur-3xl" />
          <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-[#FF6B9D]/8 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Hola de nuevo 👋</h1>
              <p className="text-slate-400 text-sm">Tu evolución emocional de los últimos 30 días</p>
            </div>
            <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white">7 días seguidos</span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Bienestar promedio", value: avgScore, sub: "/10", icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "Registros totales", value: "28", sub: "este mes", icon: <Calendar className="w-4 h-4" />, color: "text-[#6C63FF]" },
              { label: "Racha actual", value: "7", sub: "días", icon: <Flame className="w-4 h-4" />, color: "text-orange-400" },
              { label: "Tema frecuente", value: "Trabajo", sub: "12 veces", icon: <Mic className="w-4 h-4" />, color: "text-[#FF6B9D]" },
            ].map((kpi, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className={`${kpi.color} mb-2`}>{kpi.icon}</div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}<span className="text-sm text-slate-500 font-normal ml-1">{kpi.sub}</span></p>
                <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Wellbeing chart */}
            <div className="md:col-span-2 glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Puntaje de bienestar — últimos 30 días</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={wellbeingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1E1E3A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }}
                    labelStyle={{ color: "#94A3B8" }}
                    itemStyle={{ color: "#6C63FF" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6C63FF" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#6C63FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment donut */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Distribución de sentimientos</h2>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {sentimentData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-slate-400">{s.name} {s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Recent entries */}
            <div className="md:col-span-2 glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Últimos registros</h2>
              <div className="space-y-3">
                {recentEntries.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentBadge[entry.sentiment]}`}>
                          {sentimentLabel[entry.sentiment]}
                        </span>
                        <span className="text-xs text-slate-600">{entry.date}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {entry.topics.map(t => (
                          <span key={t} className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-white">{entry.score}</span>
                      <p className="text-xs text-slate-600">/10</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics word cloud */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Temas recurrentes</h2>
              <div className="flex flex-wrap gap-2">
                {topTopics.map((topic, i) => {
                  const sizes = ["text-lg", "text-base", "text-sm", "text-xs"];
                  const opacities = ["opacity-100", "opacity-80", "opacity-60", "opacity-50"];
                  const sz = sizes[Math.floor(i / 2)] || "text-xs";
                  const op = opacities[Math.floor(i / 2)] || "opacity-40";
                  return (
                    <span key={topic} className={`${sz} ${op} font-semibold text-[#6C63FF] cursor-default hover:opacity-100 transition-opacity`}>
                      {topic}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <Link
          href="/record"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center shadow-[0_0_30px_rgba(108,99,255,0.5)] hover:scale-110 transition-transform cursor-pointer z-40"
          aria-label="Nuevo registro"
        >
          <Mic className="w-6 h-6 text-white" />
        </Link>
      </main>
    </>
  );
}
