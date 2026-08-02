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

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const body = await request.json();
  if (body.code && body.code !== course.code) {
    const exists = await prisma.course.findUnique({ where: { code: String(body.code).trim() } });
    if (exists) return NextResponse.json({ error: "Course code already exists" }, { status: 409 });
  }

  const updated = await prisma.course.update({
    where: { id },
    data: {
      name: body.name ?? course.name,
      code: body.code ? String(body.code).trim().toUpperCase() : course.code,
      description: body.description !== undefined ? body.description : course.description,
      durationMonths: body.durationMonths !== undefined ? Number(body.durationMonths) : course.durationMonths,
      totalClasses: body.totalClasses !== undefined ? Number(body.totalClasses) : course.totalClasses,
      totalModules: body.totalModules !== undefined ? Number(body.totalModules) : course.totalModules,
      totalProjects: body.totalProjects !== undefined ? Number(body.totalProjects) : course.totalProjects,
      level: body.level !== undefined ? body.level : course.level,
      learningPattern: body.learningPattern !== undefined ? body.learningPattern : course.learningPattern,
      softwareUsed: body.softwareUsed !== undefined ? body.softwareUsed : course.softwareUsed,
      aiTools: body.aiTools !== undefined ? body.aiTools : course.aiTools,
      expectedOutcomes: body.expectedOutcomes !== undefined ? body.expectedOutcomes : course.expectedOutcomes,
      careerOpportunities: body.careerOpportunities !== undefined ? body.careerOpportunities : course.careerOpportunities,
      status: body.status ?? course.status,
    },
  });

  await logAudit({
    userId: user.id,
    action: "COURSE_UPDATE",
    entity: "Course",
    entityId: id,
    details: `Updated course — ${updated.name}`,
  });

  return NextResponse.json({ course: updated });
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

  const count = await prisma.student.count({ where: { courseId: id } });
  if (count > 0) return NextResponse.json({ error: "Cannot delete: students are enrolled" }, { status: 400 });

  await prisma.course.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "COURSE_DELETE", entity: "Course", entityId: id });
  return NextResponse.json({ ok: true });
}
