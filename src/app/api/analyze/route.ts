import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un analizador experto de bienestar emocional y salud mental. 
Analiza el texto proporcionado y responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "sentiment": "VERY_POSITIVE" | "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "VERY_NEGATIVE",
  "sentimentScore": número entre 0 y 1 (intensidad),
  "wellbeingScore": número entre 0 y 10,
  "emotionCategories": ["emoción1", "emoción2"],
  "topics": ["tema1", "tema2", "tema3"],
  "riskLevel": "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskKeywords": ["palabra1"],
  "aiSummary": "Reflexión empática de 2-3 oraciones en español, cálida y sin juicio"
}

Reglas:
- riskLevel HIGH o CRITICAL solo si hay indicios claros de daño, ideación suicida o crisis severa
- aiSummary debe ser cálido, empático, nunca clínico ni alarmista
- topics máximo 5, en español, concisos (1-2 palabras)
- emotionCategories en español (ej: tristeza, ansiedad, esperanza)
- Responde SOLO el JSON, sin texto adicional`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: "Texto insuficiente para analizar" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analiza este texto:\n\n"${text}"` }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Respuesta inesperada de Claude");
    }

    const analysis = JSON.parse(content.text);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Error al analizar el texto" }, { status: 500 });
  }
}
