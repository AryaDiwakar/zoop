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
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const data = {
    name: body.name ?? cls.name,
    learningTopic: body.learningTopic ?? cls.learningTopic,
    practicalExercise: body.practicalExercise ?? cls.practicalExercise,
    tutorNotes: body.tutorNotes ?? cls.tutorNotes,
    number: body.number !== undefined ? Number(body.number) : cls.number,
    durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : cls.durationMinutes,
  };
  if (body.number !== undefined && Number(body.number) !== cls.number) {
    const exists = await prisma.class.findUnique({
      where: { moduleId_number: { moduleId: cls.moduleId, number: Number(body.number) } },
    });
    if (exists) return NextResponse.json({ error: "Class number already exists for this module" }, { status: 409 });
  }

  const updated = await prisma.class.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "CLASS_UPDATE", entity: "Class", entityId: id, details: `Updated class #${updated.number} — ${updated.name}` });
  
  revalidatePath("/curriculum");
  
  return NextResponse.json({ class: updated });
}
