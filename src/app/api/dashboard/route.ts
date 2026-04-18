import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Resolve Clerk ID → internal DB user ID
    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) return NextResponse.json({ entries: [], stats: null, displayName: null });

    const entries = await prisma.entry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true, createdAt: true, sentiment: true,
        sentimentScore: true, wellbeingScore: true,
        topics: true, riskLevel: true, aiSummary: true, mode: true,
      },
    });

    if (entries.length === 0) return NextResponse.json({ entries: [], stats: null, displayName: user.displayName ?? null });

    const withScore = entries.filter(e => e.wellbeingScore !== null);
    const avgWellbeing = withScore.length
      ? withScore.reduce((a, e) => a + (e.wellbeingScore ?? 0), 0) / withScore.length
      : 0;

    const sentimentCounts: Record<string, number> = {};
    entries.forEach(e => { if (e.sentiment) sentimentCounts[e.sentiment] = (sentimentCounts[e.sentiment] ?? 0) + 1; });

    const topicCounts: Record<string, number> = {};
    entries.forEach(e => e.topics.forEach(t => { topicCounts[t] = (topicCounts[t] ?? 0) + 1; }));
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

    // Streak: consecutive days with entries
    const days = [...new Set(entries.map(e => e.createdAt.toISOString().slice(0, 10)))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < days.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      if (days[i] === expected || (i === 0 && days[0] <= today)) streak++;
      else break;
    }

    return NextResponse.json({
      entries,
      displayName: user.displayName ?? null,
      stats: { avgWellbeing, totalEntries: entries.length, sentimentCounts, topTopics, streak },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Error al cargar datos" }, { status: 500 });
  }
}
