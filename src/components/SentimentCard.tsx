"use client";

interface SentimentCardProps {
  sentiment: "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE";
  sentimentScore: number;
  wellbeingScore: number;
  topics: string[];
  aiSummary: string;
  riskLevel?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const sentimentConfig = {
  VERY_POSITIVE: { label: "Muy positivo", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: "😊" },
  POSITIVE:      { label: "Positivo",      color: "text-green-400",   bg: "bg-green-400/10 border-green-400/20",   icon: "🙂" },
  NEUTRAL:       { label: "Neutro",        color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/20",   icon: "😐" },
  NEGATIVE:      { label: "Negativo",      color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",   icon: "😔" },
  VERY_NEGATIVE: { label: "Muy negativo",  color: "text-red-400",     bg: "bg-red-400/10 border-red-400/20",       icon: "😢" },
};

export default function SentimentCard({ sentiment, sentimentScore, wellbeingScore, topics, aiSummary }: SentimentCardProps) {
  const config = sentimentConfig[sentiment];
  const wellbeingPct = (wellbeingScore / 10) * 100;
  const wellbeingColor = wellbeingScore >= 7 ? "#10B981" : wellbeingScore >= 4 ? "#F59E0B" : "#EF4444";

  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-2xl mx-auto animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Tu análisis emocional</h3>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className={`rounded-xl border p-4 ${config.bg}`}>
          <p className="text-xs text-slate-400 mb-1">Sentimiento</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={config.label}>{config.icon}</span>
            <div>
              <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-slate-500">{Math.round(sentimentScore * 100)}% intensidad</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400 mb-2">Bienestar</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold text-white">{wellbeingScore.toFixed(1)}</span>
            <span className="text-xs text-slate-500 mb-1">/10</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${wellbeingPct}%`, backgroundColor: wellbeingColor }}
            />
          </div>
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Temas detectados</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/20 font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-xs text-slate-400 mb-1">Reflexión de MindEcho</p>
        <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
      </div>
    </div>
  );
}
