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

    const result = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "es",
    });

    const text = result.text.trim();

    // Detect numeric hallucination (e.g. "76 78 79 80 ... 100") — common when
    // Whisper can't interpret the audio format or the recording is too short/silent
    const isHallucination = /^[\d\s.,]+$/.test(text) || text.length < 3;
    if (isHallucination) {
      return NextResponse.json(
        { error: "No se detectó voz clara. Intenta hablar más cerca del micrófono o graba por más tiempo." },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcription: text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Error al transcribir el audio" }, { status: 500 });
  }
}
