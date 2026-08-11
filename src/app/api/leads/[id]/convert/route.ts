import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addDays } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { mapCurriculumForStudent, createEmiSchedule, nextRollNumber } from "@/lib/curriculum";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "COUNSELLOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedStudent: { select: { id: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.convertedStudent) return NextResponse.json({ error: "Lead already converted" }, { status: 400 });

  const body = await request.json();
  const courseId = body.courseId;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });

  const joiningDate = body.joiningDate ? new Date(body.joiningDate) : new Date();
  const courseStartDate = body.courseStartDate ? new Date(body.courseStartDate) : joiningDate;
  const expectedCompletionDate = body.expectedCompletionDate
    ? new Date(body.expectedCompletionDate)
    : addDays(courseStartDate, course.durationMonths * 30);

  const netFee = Number(body.courseFee || 0) + Number(body.registrationFee || 0) - Number(body.discount || 0);
  const rollNumber = body.rollNumber || (await nextRollNumber());

  const student = await prisma.student.create({
    data: {
      rollNumber,
      name: lead.studentName,
      parentName: body.parentName ?? lead.parentName,
      mobile: lead.mobile,
      altMobile: body.altMobile ?? lead.altMobile,
      email: body.email ?? lead.email,
      address: body.address ?? lead.address,
      qualification: body.qualification ?? lead.qualification,
      occupation: body.occupation || null,
      joiningDate,
      dob: body.dob ? new Date(body.dob) : null,
      emergencyContact: body.emergencyContact || null,
      notes: body.notes || null,
      status: "IN_PROGRESS",
      courseId,
      batchId: body.batchId || null,
      tutorId: body.tutorId || null,
      courseStartDate,
      expectedCompletionDate,
      courseDurationMonths: Number(body.courseDurationMonths || course.durationMonths),
      leadId: lead.id,
      courseFee: Number(body.courseFee || 0),
      registrationFee: Number(body.registrationFee || 0),
      discount: Number(body.discount || 0),
      netFee,
      paymentType: body.paymentType || "LUMPSUM",
      paymentTerms: body.paymentTerms || null,
    },
  });

  // Availability
  if (Array.isArray(body.availability)) {
    for (const a of body.availability) {
      if (a.day === "" || a.day === undefined) continue;
      await prisma.availability.create({
        data: { studentId: student.id, dayOfWeek: Number(a.day), startTime: a.start || "10:00", endTime: a.end || "12:00" },
      });
    }
  }

  // Map curriculum + create portfolio/certificate + EMI schedule
  await mapCurriculumForStudent(student.id, courseId);
  await createEmiSchedule({
    studentId: student.id,
    netFee,
    registrationFee: Number(body.registrationFee || 0),
    paymentType: body.paymentType || "LUMPSUM",
    courseStartDate,
    emis: body.emis,
  });

  await prisma.lead.update({ where: { id }, data: { status: "CONVERTED" } });
  await logAudit({
    userId: user.id,
    action: "LEAD_CONVERT",
    entity: "Lead",
    entityId: id,
    details: `Converted lead to student ${rollNumber} — ${lead.studentName}`,
  });
  await logAudit({ userId: user.id, action: "STUDENT_CREATE", entity: "Student", entityId: student.id, details: `Student admitted (${course.name})` });

  return NextResponse.json({ student });
}
