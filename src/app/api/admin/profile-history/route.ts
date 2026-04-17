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

    const history = await prisma.profileHistory.findMany({
      orderBy: { changedAt: "desc" },
      take: 100,
      select: {
        id: true,
        field: true,
        oldValue: true,
        newValue: true,
        changedAt: true,
        userId: true,
      },
    });

    // Return anonymized history — only DB user id (not clerk id, not email)
    return NextResponse.json(history);
  } catch (error) {
    console.error("Profile history error:", error);
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
  }
}
