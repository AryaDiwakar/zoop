import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.role) data.role = body.role;
  if (body.name) data.name = body.name;
  if (body.password) data.passwordHash = await bcrypt.hash(String(body.password), 10);

  const updated = await prisma.user.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "USER_UPDATE", entity: "User", entityId: id, details: `Updated user — ${updated.name}` });
  return NextResponse.json({ ok: true });
}
