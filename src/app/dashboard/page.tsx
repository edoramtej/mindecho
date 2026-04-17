"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Mic, TrendingUp, Flame, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { useUser } from "@clerk/nextjs";

type SentimentLevel = "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";

interface Entry {
  id: string;
  createdAt: string;
  sentiment: SentimentLevel | null;
  wellbeingScore: number | null;
  topics: string[];
}

interface Stats {
  avgWellbeing: number;
  totalEntries: number;
  sentimentCounts: Record<string, number>;
  topTopics: string[];
  streak: number;
}

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
const sentimentColors: Record<string, string> = {
  VERY_POSITIVE: "#10B981", POSITIVE: "#34D399",
  NEUTRAL: "#64748B", NEGATIVE: "#F59E0B", VERY_NEGATIVE: "#EF4444",
};

const TOOLTIP_STYLE = { background: "#1E1E3A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" };

export default function DashboardPage() {
  const { user } = useUser();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(data => { setEntries(data.entries ?? []); setStats(data.stats ?? null); })
      .finally(() => setLoading(false));
  }, []);

  const wellbeingChartData = entries
    .filter(e => e.wellbeingScore !== null)
    .slice(0, 30)
    .reverse()
    .map((e, i) => ({ day: `${i + 1}`, score: e.wellbeingScore }));

  const sentimentPieData = stats
    ? Object.entries(stats.sentimentCounts).map(([name, value]) => ({
        name: sentimentLabel[name] ?? name,
        value,
        color: sentimentColors[name] ?? "#6C63FF",
      }))
    : [];

  const recentEntries = entries.slice(0, 5);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin" />
            <p className="text-slate-400 text-sm">Cargando tu evolución...</p>
          </div>
        </div>
      </>
    );
  }

  const firstName = user?.firstName ?? "de nuevo";

  if (!stats || entries.length === 0) {
    return (
      <>
        <NavBar />
        <main className="min-h-screen flex items-center justify-center px-4 pt-24">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎙️</div>
            <h1 className="text-2xl font-bold text-white mb-3">¡Bienvenido, {firstName}!</h1>
            <p className="text-slate-400 mb-6">Aún no tienes registros. Haz tu primer descargo para ver tu evolución aquí.</p>
            <Link href="/record"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer">
              <Mic className="w-4 h-4" /> Hacer mi primer registro
            </Link>
          </div>
        </main>
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

        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Hola, {firstName} 👋</h1>
              <p className="text-slate-400 text-sm">Tu evolución emocional personal</p>
            </div>
            {stats.streak > 0 && (
              <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">{stats.streak} {stats.streak === 1 ? "día seguido" : "días seguidos"}</span>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Bienestar promedio", value: stats.avgWellbeing.toFixed(1), sub: "/10", icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-400" },
              { label: "Registros totales", value: String(stats.totalEntries), sub: "en total", icon: <Calendar className="w-4 h-4" />, color: "text-[#6C63FF]" },
              { label: "Racha actual", value: String(stats.streak), sub: stats.streak === 1 ? "día" : "días", icon: <Flame className="w-4 h-4" />, color: "text-orange-400" },
              { label: "Tema frecuente", value: stats.topTopics[0] ?? "—", sub: "más mencionado", icon: <Mic className="w-4 h-4" />, color: "text-[#FF6B9D]" },
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
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Puntaje de bienestar — últimos registros</h2>
              {wellbeingChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={wellbeingChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94A3B8" }} itemStyle={{ color: "#6C63FF" }} />
                    <Line type="monotone" dataKey="score" stroke="#6C63FF" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#6C63FF" }} name="Bienestar" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                  Necesitas más registros para ver la tendencia
                </div>
              )}
            </div>

            {/* Sentiment donut */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Distribución de sentimientos</h2>
              {sentimentPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={sentimentPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {sentimentPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-1 gap-1 mt-2">
                    {sentimentPieData.map((s) => (
                      <div key={s.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-slate-400">{s.name}: {s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-600 text-sm">Sin datos aún</div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Recent entries */}
            <div className="md:col-span-2 glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Últimos registros</h2>
              {recentEntries.length > 0 ? (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-default">
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
              ) : (
                <p className="text-slate-600 text-sm">Sin registros aún</p>
              )}
            </div>

            {/* Topics word cloud */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Temas recurrentes</h2>
              {stats.topTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topTopics.map((topic, i) => {
                    const sizes = ["text-xl", "text-lg", "text-base", "text-sm", "text-xs"];
                    const opacities = ["opacity-100", "opacity-85", "opacity-70", "opacity-55", "opacity-45"];
                    return (
                      <span key={topic} className={`${sizes[Math.min(i, 4)]} ${opacities[Math.min(i, 4)]} font-semibold text-[#6C63FF] cursor-default hover:opacity-100 transition-opacity`}>
                        {topic}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">Sin temas aún</p>
              )}
            </div>
          </div>
        </div>

        <Link href="/record"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center shadow-[0_0_30px_rgba(108,99,255,0.5)] hover:scale-110 transition-transform cursor-pointer z-40"
          aria-label="Nuevo registro">
          <Mic className="w-6 h-6 text-white" />
        </Link>
      </main>
    </>
  );
}
