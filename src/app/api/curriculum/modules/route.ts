import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { courseId, number, name } = body;
  if (!courseId || !number || !name)
    return NextResponse.json({ error: "Course, number and name are required" }, { status: 400 });

  const exists = await prisma.module.findUnique({
    where: { courseId_number: { courseId, number: Number(number) } },
  });
  if (exists) return NextResponse.json({ error: "Module number already exists for this course" }, { status: 409 });

  const module = await prisma.module.create({
    data: {
      courseId,
      number: Number(number),
      name,
      description: body.description || null,
      learningObjectives: body.learningObjectives || null,
      totalClasses: Number(body.totalClasses || 0),
    },
  });

  await prisma.course.update({
    where: { id: courseId },
    data: { totalModules: { increment: 1 } },
  });

  await logAudit({
    userId: user.id,
    action: "MODULE_CREATE",
    entity: "Module",
    entityId: module.id,
    details: `Created module M${module.number} — ${module.name}`,
  });

  revalidatePath("/curriculum");
  revalidatePath(`/courses/${courseId}`);

  return NextResponse.json({ module });
}
