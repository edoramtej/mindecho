import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Verify the entry belongs to this user before deleting
    const entry = await prisma.entry.findUnique({ where: { id }, select: { userId: true } });
    if (!entry) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    if (entry.userId !== user.id) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

    await prisma.entry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entry delete error:", error);
    return NextResponse.json({ error: "Error al eliminar el registro" }, { status: 500 });
  }
}
