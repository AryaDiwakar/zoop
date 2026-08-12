import { NextResponse } from "next/server";
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
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const data = {
    name: body.name ?? module.name,
    description: body.description ?? module.description,
    learningObjectives: body.learningObjectives ?? module.learningObjectives,
    number: body.number !== undefined ? Number(body.number) : module.number,
    totalClasses: body.totalClasses !== undefined ? Number(body.totalClasses) : module.totalClasses,
  };
  if (body.number !== undefined && Number(body.number) !== module.number) {
    const exists = await prisma.module.findUnique({
      where: { courseId_number: { courseId: module.courseId, number: Number(body.number) } },
    });
    if (exists) return NextResponse.json({ error: "Module number already exists for this course" }, { status: 409 });
  }

  const updated = await prisma.module.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "MODULE_UPDATE", entity: "Module", entityId: id, details: `Updated module M${updated.number} — ${updated.name}` });
  return NextResponse.json({ module: updated });
}

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
