import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const active = await prisma.studentModule.count({
    where: { moduleId: id, status: { not: "COMPLETED" } },
  });
  if (active > 0)
    return NextResponse.json({ error: "Cannot delete: students are actively working on this module" }, { status: 400 });

  await prisma.module.delete({ where: { id } });
  await prisma.course.update({
    where: { id: module.courseId },
    data: { totalModules: { decrement: 1 } },
  });
  await logAudit({ userId: user.id, action: "MODULE_DELETE", entity: "Module", entityId: id });
  return NextResponse.json({ ok: true });
}
