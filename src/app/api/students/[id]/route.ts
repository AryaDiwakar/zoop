import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { parseJsonBody } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseJsonBody(request);
  const isAdminOrCounsellor = user.role === "SUPER_ADMIN" || user.role === "COUNSELLOR";
  const isFinance = user.role === "FINANCE";
  const allowed = isAdminOrCounsellor || isFinance;

  const dateFields = ["dob", "joiningDate", "courseStartDate", "expectedCompletionDate"];
  const plainFields = [
    "name", "parentName", "mobile", "altMobile", "email", "address", "qualification",
    "occupation", "emergencyContact", "notes", "status", "tutorId", "batchId", "courseId",
    "paymentType", "paymentTerms",
  ];
  const numFields = ["courseDurationMonths", "courseFee", "registrationFee", "discount", "netFee"];

  const data: Record<string, unknown> = {};
  for (const f of dateFields) {
    if (body[f] !== undefined) data[f] = body[f] ? new Date(body[f]) : null;
  }
  for (const f of plainFields) {
    if (body[f] !== undefined) data[f] = body[f] || null;
  }
  for (const f of numFields) {
    if (body[f] !== undefined) data[f] = Number(body[f]);
  }

  if (user.role === "TUTOR") {
    // tutors may only update attendance/progress, not profile
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isAdminOrCounsellor && !isFinance) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Recompute net fee when fee components change
  if (data.courseFee !== undefined || data.registrationFee !== undefined || data.discount !== undefined) {
    const current = await prisma.student.findUnique({ where: { id }, select: { courseFee: true, registrationFee: true, discount: true, netFee: true } });
    if (current) {
      const courseFee = data.courseFee !== undefined ? Number(data.courseFee) : current.courseFee;
      const registrationFee = data.registrationFee !== undefined ? Number(data.registrationFee) : current.registrationFee;
      const discount = data.discount !== undefined ? Number(data.discount) : current.discount;
      data.netFee = courseFee + registrationFee - discount;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const student = await prisma.student.update({ where: { id }, data });

  // Availability / class timings — replace the whole set when provided
  if (Array.isArray(body.availability)) {
    await prisma.availability.deleteMany({ where: { studentId: id } });
    for (const a of body.availability) {
      if (a.day === "" || a.day === undefined) continue;
      await prisma.availability.create({
        data: { studentId: id, dayOfWeek: Number(a.day), startTime: a.start || "10:00", endTime: a.end || "12:00" },
      });
    }
  }

  await logAudit({ userId: user.id, action: "STUDENT_UPDATE", entity: "Student", entityId: id, details: `Updated ${student.name}` });
  return NextResponse.json({ student });
}
