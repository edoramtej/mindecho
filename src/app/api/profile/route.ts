import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    // Ensure user exists in DB
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { clerkId: userId },
    });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { sociodemographic: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Error al cargar perfil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();

    // Ensure user exists and save displayName
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { displayName: body.displayName?.trim() || null },
      create: { clerkId: userId, displayName: body.displayName?.trim() || null },
      include: { sociodemographic: true },
    });

    // Track changes for history
    const fields = [
      "ageRange", "genderIdentity", "genderOther", "country", "region",
      "educationLevel", "employmentStatus", "maritalStatus",
      "hasPriorDiagnosis", "consentResearch",
    ] as const;

    const old = user.sociodemographic;
    const historyEntries: { userId: string; field: string; oldValue: string | null; newValue: string | null }[] = [];

    fields.forEach(field => {
      const oldVal = old ? String(old[field] ?? "") : "";
      const newVal = String(body[field] ?? "");
      if (oldVal !== newVal) {
        historyEntries.push({
          userId: user.id,
          field,
          oldValue: oldVal || null,
          newValue: newVal || null,
        });
      }
    });

    // Upsert sociodemographic
    const socio = await prisma.sociodemographic.upsert({
      where: { userId: user.id },
      update: {
        ageRange: body.ageRange || null,
        genderIdentity: body.genderIdentity || null,
        genderOther: body.genderOther || null,
        country: body.country || null,
        region: body.region || null,
        educationLevel: body.educationLevel || null,
        employmentStatus: body.employmentStatus || null,
        maritalStatus: body.maritalStatus || null,
        hasPriorDiagnosis: body.hasPriorDiagnosis ?? null,
        consentResearch: body.consentResearch ?? false,
      },
      create: {
        userId: user.id,
        ageRange: body.ageRange || null,
        genderIdentity: body.genderIdentity || null,
        genderOther: body.genderOther || null,
        country: body.country || null,
        region: body.region || null,
        educationLevel: body.educationLevel || null,
        employmentStatus: body.employmentStatus || null,
        maritalStatus: body.maritalStatus || null,
        hasPriorDiagnosis: body.hasPriorDiagnosis ?? null,
        consentResearch: body.consentResearch ?? false,
      },
    });

    // Save history
    if (historyEntries.length > 0) {
      await prisma.profileHistory.createMany({ data: historyEntries });
    }

    return NextResponse.json({ sociodemographic: socio, displayName: user.displayName, changes: historyEntries.length });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Error al guardar perfil" }, { status: 500 });
  }
}
