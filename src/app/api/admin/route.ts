import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const role = (user.publicMetadata as { role?: string })?.role;
  return role === "admin" ? userId : null;
}

function weekStart(d: Date): string {
  const s = new Date(d);
  s.setDate(d.getDate() - d.getDay());
  return s.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : null;
    const to = toParam ? new Date(toParam) : null;
    if (to) to.setHours(23, 59, 59, 999);

    const dateFilter = (from || to)
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {};

    // Auto-detect granularity for trend chart
    const daysDiff = from && to
      ? Math.ceil((to.getTime() - from.getTime()) / 86_400_000)
      : 365;
    const granularity: "day" | "week" | "month" =
      daysDiff <= 35 ? "day" : daysDiff <= 100 ? "week" : "month";

    const [totalEntries, riskAlerts, anonymousEntries, entries, recentAnonymous] = await Promise.all([
      prisma.entry.count({ where: dateFilter }),
      prisma.entry.count({ where: { ...dateFilter, riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
      prisma.entry.count({ where: { ...dateFilter, userId: null } }),
      prisma.entry.findMany({
        where: dateFilter,
        select: {
          sentiment: true, wellbeingScore: true, riskLevel: true,
          topics: true, createdAt: true, riskKeywords: true,
          sociodemographic: {
            select: { genderIdentity: true, ageRange: true, country: true, employmentStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 2000,
      }),
      prisma.entry.findMany({
        where: { ...dateFilter, userId: null },
        select: {
          id: true, createdAt: true, sentiment: true,
          wellbeingScore: true, topics: true, sociodemographicId: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Wellbeing average
    const withScore = entries.filter(e => e.wellbeingScore !== null);
    const avgWellbeing = withScore.length
      ? withScore.reduce((a, e) => a + (e.wellbeingScore ?? 0), 0) / withScore.length
      : 0;

    // Sentiment distribution
    const sentimentCounts: Record<string, number> = {};
    entries.forEach(e => {
      if (e.sentiment) sentimentCounts[e.sentiment] = (sentimentCounts[e.sentiment] ?? 0) + 1;
    });

    // Topic frequency
    const topicCounts: Record<string, number> = {};
    entries.forEach(e => e.topics.forEach(t => { topicCounts[t] = (topicCounts[t] ?? 0) + 1; }));
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Wellbeing by gender
    const byGender: Record<string, number[]> = {};
    entries.forEach(e => {
      const g = e.sociodemographic?.genderIdentity ?? "UNKNOWN";
      if (!byGender[g]) byGender[g] = [];
      if (e.wellbeingScore !== null) byGender[g].push(e.wellbeingScore);
    });
    const wellbeingByGender = Object.entries(byGender)
      .map(([name, scores]) => ({ name, score: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length }))
      .filter(x => x.count > 0);

    // Wellbeing by age
    const byAge: Record<string, number[]> = {};
    entries.forEach(e => {
      const a = e.sociodemographic?.ageRange ?? "UNKNOWN";
      if (!byAge[a]) byAge[a] = [];
      if (e.wellbeingScore !== null) byAge[a].push(e.wellbeingScore);
    });
    const wellbeingByAge = Object.entries(byAge)
      .map(([name, scores]) => ({ name, score: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length }))
      .filter(x => x.count > 0);

    // Wellbeing by employment
    const byEmployment: Record<string, number[]> = {};
    entries.forEach(e => {
      const em = e.sociodemographic?.employmentStatus ?? "UNKNOWN";
      if (!byEmployment[em]) byEmployment[em] = [];
      if (e.wellbeingScore !== null) byEmployment[em].push(e.wellbeingScore);
    });
    const wellbeingByEmployment = Object.entries(byEmployment)
      .map(([name, scores]) => ({ name, score: scores.reduce((a, b) => a + b, 0) / scores.length, count: scores.length }))
      .filter(x => x.count > 0);

    // Sentiment trend grouped by granularity
    const trend: Record<string, Record<string, number>> = {};
    entries.forEach(e => {
      const d = new Date(e.createdAt);
      const key =
        granularity === "day" ? e.createdAt.toISOString().slice(0, 10) :
        granularity === "week" ? weekStart(d) :
        e.createdAt.toISOString().slice(0, 7);
      if (!trend[key]) trend[key] = { positive: 0, neutral: 0, negative: 0 };
      if (e.sentiment === "VERY_POSITIVE" || e.sentiment === "POSITIVE") trend[key].positive++;
      else if (e.sentiment === "NEUTRAL") trend[key].neutral++;
      else if (e.sentiment === "NEGATIVE" || e.sentiment === "VERY_NEGATIVE") trend[key].negative++;
    });

    const labelFor = (key: string) => {
      if (granularity === "month") return key.slice(0, 7); // YYYY-MM
      return key.slice(5); // MM-DD
    };

    const sentimentTrend = Object.entries(trend)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, counts]) => ({ day: labelFor(key), ...counts }));

    // Risk alerts
    const riskEntries = entries
      .filter(e => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL")
      .slice(0, 50)
      .map(e => ({
        risk: e.riskLevel,
        keywords: e.riskKeywords,
        country: e.sociodemographic?.country ?? "Desconocido",
        time: e.createdAt,
      }));

    return NextResponse.json({
      overview: {
        totalEntries, riskAlerts, avgWellbeing: parseFloat(avgWellbeing.toFixed(1)),
        anonymousEntries, authenticatedEntries: totalEntries - anonymousEntries,
      },
      granularity,
      recentAnonymous,
      sentimentCounts,
      sentimentTrend,
      topTopics,
      wellbeingByGender,
      wellbeingByAge,
      wellbeingByEmployment,
      riskEntries,
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}
