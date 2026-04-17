import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    if (!text || text.trim().length < 1) {
      return NextResponse.json({ error: "Texto insuficiente para analizar" }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analiza este texto:\n\n"${text}"` },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Respuesta vacía de OpenAI");

    const analysis = JSON.parse(content);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Error al analizar el texto" }, { status: 500 });
  }
}
