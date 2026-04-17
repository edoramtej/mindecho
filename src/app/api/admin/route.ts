import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const adminId = await requireAdmin();
    if (!adminId) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

    const [totalEntries, riskAlerts, entries] = await Promise.all([
      prisma.entry.count(),
      prisma.entry.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } }),
      prisma.entry.findMany({
        select: {
          sentiment: true, wellbeingScore: true, riskLevel: true,
          topics: true, createdAt: true, riskKeywords: true,
          sociodemographic: {
            select: { genderIdentity: true, ageRange: true, country: true, employmentStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
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
    const wellbeingByGender = Object.entries(byGender).map(([name, scores]) => ({
      name, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0, count: scores.length,
    })).filter(x => x.count > 0);

    // Wellbeing by age
    const byAge: Record<string, number[]> = {};
    entries.forEach(e => {
      const a = e.sociodemographic?.ageRange ?? "UNKNOWN";
      if (!byAge[a]) byAge[a] = [];
      if (e.wellbeingScore !== null) byAge[a].push(e.wellbeingScore);
    });
    const wellbeingByAge = Object.entries(byAge).map(([name, scores]) => ({
      name, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0, count: scores.length,
    })).filter(x => x.count > 0);

    // Wellbeing by employment
    const byEmployment: Record<string, number[]> = {};
    entries.forEach(e => {
      const em = e.sociodemographic?.employmentStatus ?? "UNKNOWN";
      if (!byEmployment[em]) byEmployment[em] = [];
      if (e.wellbeingScore !== null) byEmployment[em].push(e.wellbeingScore);
    });
    const wellbeingByEmployment = Object.entries(byEmployment).map(([name, scores]) => ({
      name, score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0, count: scores.length,
    })).filter(x => x.count > 0);

    // Sentiment trend (last 14 days)
    const trend: Record<string, Record<string, number>> = {};
    entries.slice(0, 200).forEach(e => {
      const day = e.createdAt.toISOString().slice(0, 10);
      if (!trend[day]) trend[day] = { positive: 0, neutral: 0, negative: 0 };
      if (e.sentiment === "VERY_POSITIVE" || e.sentiment === "POSITIVE") trend[day].positive++;
      else if (e.sentiment === "NEUTRAL") trend[day].neutral++;
      else if (e.sentiment === "NEGATIVE" || e.sentiment === "VERY_NEGATIVE") trend[day].negative++;
    });
    const sentimentTrend = Object.entries(trend)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([day, counts]) => ({ day: day.slice(5), ...counts }));

    // Risk alerts (fully anonymous — no userId, no sessionToken)
    const riskEntries = entries
      .filter(e => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL")
      .slice(0, 20)
      .map(e => ({
        risk: e.riskLevel,
        keywords: e.riskKeywords,
        country: e.sociodemographic?.country ?? "Desconocido",
        time: e.createdAt,
      }));

    return NextResponse.json({
      overview: { totalEntries, riskAlerts, avgWellbeing: parseFloat(avgWellbeing.toFixed(1)) },
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
