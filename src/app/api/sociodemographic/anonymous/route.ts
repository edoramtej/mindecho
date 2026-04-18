import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, ageRange, genderIdentity, genderOther, country, region,
      educationLevel, employmentStatus, maritalStatus, hasPriorDiagnosis, consentResearch } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: "sessionToken requerido" }, { status: 400 });
    }
    if (!ageRange || !genderIdentity || !country) {
      return NextResponse.json({ error: "Campos obligatorios incompletos" }, { status: 400 });
    }

    const socio = await prisma.sociodemographic.upsert({
      where: { sessionToken },
      update: {
        ageRange: ageRange || null,
        genderIdentity: genderIdentity || null,
        genderOther: genderOther || null,
        country: country || null,
        region: region || null,
        educationLevel: educationLevel || null,
        employmentStatus: employmentStatus || null,
        maritalStatus: maritalStatus || null,
        hasPriorDiagnosis: hasPriorDiagnosis ?? null,
        consentResearch: consentResearch ?? false,
      },
      create: {
        sessionToken,
        ageRange: ageRange || null,
        genderIdentity: genderIdentity || null,
        genderOther: genderOther || null,
        country: country || null,
        region: region || null,
        educationLevel: educationLevel || null,
        employmentStatus: employmentStatus || null,
        maritalStatus: maritalStatus || null,
        hasPriorDiagnosis: hasPriorDiagnosis ?? null,
        consentResearch: consentResearch ?? false,
      },
    });

    return NextResponse.json({ id: socio.id });
  } catch (error) {
    console.error("Anonymous sociodemographic error:", error);
    return NextResponse.json({ error: "Error al guardar datos" }, { status: 500 });
  }
}
