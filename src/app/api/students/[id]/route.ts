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

  const body = await request.json();
  const allowed = user.role === "SUPER_ADMIN" || user.role === "COUNSELLOR" || user.role === "FINANCE";

  const data: Record<string, unknown> = {};
  for (const field of [
    "name", "parentName", "mobile", "altMobile", "email", "address", "qualification",
    "occupation", "dob", "emergencyContact", "notes", "status", "tutorId", "batchId",
  ]) {
    if (body[field] !== undefined) {
      data[field] = field === "dob" && body[field] ? new Date(body[field]) : body[field] || null;
    }
  }
  if (body.courseId) data.courseId = body.courseId;

  if (user.role === "FINANCE") {
    for (const f of ["courseFee", "registrationFee", "discount", "netFee", "paymentType", "paymentTerms"]) {
      if (body[f] !== undefined) data[f] = f === "netFee" ? Number(body[f]) : body[f];
    }
  } else if (user.role === "TUTOR") {
    // tutors may only update attendance/progress, not profile
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (allowed) {
    for (const f of ["courseFee", "registrationFee", "discount", "netFee", "paymentType", "paymentTerms"]) {
      if (body[f] !== undefined) data[f] = f === "netFee" ? Number(body[f]) : body[f];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const student = await prisma.student.update({ where: { id }, data });
  await logAudit({ userId: user.id, action: "STUDENT_UPDATE", entity: "Student", entityId: id, details: `Updated ${student.name}` });
  return NextResponse.json({ student });
}
