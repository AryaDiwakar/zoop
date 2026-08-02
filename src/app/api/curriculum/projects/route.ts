import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { courseId, name } = body;
  if (!courseId || !name) return NextResponse.json({ error: "Course and name are required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      courseId,
      moduleId: body.moduleId || null,
      name,
      description: body.description || null,
      deliverables: body.deliverables || null,
      difficulty: body.difficulty || null,
      estimatedHours: Number(body.estimatedHours || 0),
      evaluationCriteria: body.evaluationCriteria || null,
    },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: { totalProjects: { increment: 1 } },
  });

  await logAudit({
    userId: user.id,
    action: "PROJECT_CREATE",
    entity: "Project",
    entityId: project.id,
    details: `Created project — ${project.name}`,
  });

  return NextResponse.json({ project });
}
