import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { nextAvailableSlot, updateModuleProgressFromClasses } from "@/lib/curriculum";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "TUTOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const status = body.status as string;
  if (!["PRESENT", "ABSENT", "RESCHEDULED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const studentClass = await prisma.studentClass.findUnique({
    where: { id },
    include: { student: true, class: { include: { module: true } } },
  });
  if (!studentClass) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const now = new Date();
  let plannedDate = studentClass.plannedDate;
  let remarks = body.remarks || null;

  if (status === "ABSENT") {
    // Auto-reschedule to the next available day per the student's weekly availability
    const nextSlot = await nextAvailableSlot(studentClass.studentId, now);
    plannedDate = nextSlot || plannedDate;
    remarks = `Missed class — auto-rescheduled to ${plannedDate?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
  }

  await prisma.studentClass.update({
    where: { id },
    data: {
      attendance: status,
      actualDate: status === "PRESENT" ? now : status === "ABSENT" ? now : body.actualDate ? new Date(body.actualDate) : null,
      plannedDate,
      tutorId: body.tutorId || user.id,
      remarks,
    },
  });

  await prisma.attendance.create({
    data: {
      date: now,
      time: now.toTimeString().slice(0, 5),
      studentId: studentClass.studentId,
      tutorId: body.tutorId || user.id,
      moduleId: studentClass.class.moduleId,
      classId: studentClass.classId,
      status,
      remarks,
    },
  });

  if (status === "PRESENT") {
    await updateModuleProgressFromClasses(studentClass.studentId, studentClass.class.moduleId);
  }

  await logAudit({
    userId: user.id,
    action: "ATTENDANCE_UPDATE",
    entity: "StudentClass",
    entityId: id,
    details: `Marked ${status} for ${studentClass.student.name} — ${studentClass.class.name}`,
  });

  return NextResponse.json({ ok: true, plannedDate });
}
