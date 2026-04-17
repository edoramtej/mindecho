import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json({ error: "No se recibió audio" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "es",
      response_format: "text",
    });

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Error al transcribir el audio" }, { status: 500 });
  }
}
