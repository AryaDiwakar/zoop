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
  if (!body.name || !body.courseId)
    return NextResponse.json({ error: "Name and course are required" }, { status: 400 });

  const batch = await prisma.batch.create({
    data: {
      name: body.name,
      courseId: body.courseId,
      tutorId: body.tutorId || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      timings: body.timings || null,
      status: body.status || "ACTIVE",
    },
  });

  await logAudit({ userId: user.id, action: "BATCH_CREATE", entity: "Batch", entityId: batch.id, details: `Created batch — ${batch.name}` });
  return NextResponse.json({ batch });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Batch id required" }, { status: 400 });

  const batch = await prisma.batch.update({
    where: { id },
    data: {
      name: data.name,
      courseId: data.courseId,
      tutorId: data.tutorId !== undefined ? data.tutorId : undefined,
      startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
      timings: data.timings !== undefined ? data.timings : undefined,
      status: data.status,
    },
  });

  await logAudit({ userId: user.id, action: "BATCH_UPDATE", entity: "Batch", entityId: id, details: `Updated batch — ${batch.name}` });
  return NextResponse.json({ batch });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Batch id required" }, { status: 400 });

  const count = await prisma.student.count({ where: { batchId: id } });
  if (count > 0) return NextResponse.json({ error: "Cannot delete: students are assigned" }, { status: 400 });

  await prisma.batch.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "BATCH_DELETE", entity: "Batch", entityId: id });
  return NextResponse.json({ ok: true });
}
