import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

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
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const data = {
    name: body.name ?? project.name,
    description: body.description ?? project.description,
    deliverables: body.deliverables ?? project.deliverables,
    difficulty: body.difficulty ?? project.difficulty,
    evaluationCriteria: body.evaluationCriteria ?? project.evaluationCriteria,
    estimatedHours: body.estimatedHours !== undefined ? Number(body.estimatedHours) : project.estimatedHours,
    moduleId: body.moduleId !== undefined ? (body.moduleId || null) : project.moduleId,
  };

  const updated = await prisma.project.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "PROJECT_UPDATE", entity: "Project", entityId: id, details: `Updated project — ${updated.name}` });
  
  revalidatePath("/curriculum");
  
  return NextResponse.json({ project: updated });
}
