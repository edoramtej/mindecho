import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// One-time route to grant admin role to the authenticated user.
// Call GET /api/admin/setup once from the browser while logged in, then this route can be deleted.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { role: "admin" },
  });

  return NextResponse.json({ ok: true, message: `Rol admin asignado a ${userId}` });
}
