import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const body = await req.json();
    const {
      sessionToken, sociodemographicId,
      mode, transcription, textContent,
      sentiment, sentimentScore, emotionCategories,
      topics, riskLevel, riskKeywords, aiSummary, wellbeingScore,
    } = body;

    // Use Clerk userId if authenticated, otherwise anonymous session token
    const userId = clerkUserId ?? null;

    const entry = await prisma.entry.create({
      data: {
        sessionToken: sessionToken ?? null,
        userId: userId ?? null,
        sociodemographicId: sociodemographicId ?? null,
        mode: mode ?? "VOICE",
        transcription: transcription ?? null,
        textContent: textContent ?? null,
        sentiment: sentiment ?? null,
        sentimentScore: sentimentScore ?? null,
        emotionCategories: emotionCategories ?? [],
        topics: topics ?? [],
        riskLevel: riskLevel ?? "NONE",
        riskKeywords: riskKeywords ?? [],
        aiSummary: aiSummary ?? null,
        wellbeingScore: wellbeingScore ?? null,
      },
    });

    return NextResponse.json({ id: entry.id, createdAt: entry.createdAt });
  } catch (error) {
    console.error("Entry save error:", error);
    return NextResponse.json({ error: "Error al guardar el registro" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const sessionToken = searchParams.get("sessionToken");

    if (!userId && !sessionToken) {
      return NextResponse.json({ error: "Se requiere userId o sessionToken" }, { status: 400 });
    }

    const entries = await prisma.entry.findMany({
      where: userId ? { userId } : { sessionToken: sessionToken! },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, createdAt: true, mode: true,
        sentiment: true, sentimentScore: true,
        wellbeingScore: true, topics: true,
        riskLevel: true, aiSummary: true,
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Entries fetch error:", error);
    return NextResponse.json({ error: "Error al obtener registros" }, { status: 500 });
  }
}
