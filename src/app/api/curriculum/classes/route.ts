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
  const { moduleId, number, name } = body;
  if (!moduleId || !number || !name)
    return NextResponse.json({ error: "Module, number and name are required" }, { status: 400 });

  const exists = await prisma.class.findUnique({
    where: { moduleId_number: { moduleId, number: Number(number) } },
  });
  if (exists) return NextResponse.json({ error: "Class number already exists for this module" }, { status: 409 });

  const cls = await prisma.class.create({
    data: {
      moduleId,
      number: Number(number),
      name,
      learningTopic: body.learningTopic || null,
      practicalExercise: body.practicalExercise || null,
      durationMinutes: Number(body.durationMinutes || 120),
    },
  });

  await prisma.module.update({
    where: { id: moduleId },
    data: { totalClasses: { increment: 1 } },
  });

  await logAudit({
    userId: user.id,
    action: "CLASS_CREATE",
    entity: "Class",
    entityId: cls.id,
    details: `Created class #${cls.number} — ${cls.name}`,
  });

  revalidatePath("/curriculum");

  return NextResponse.json({ class: cls });
}
