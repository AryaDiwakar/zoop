import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addDays } from "@/lib/utils";
import { logAudit } from "@/lib/audit";
import { mapCurriculumForStudent, createEmiSchedule, nextRollNumber } from "@/lib/curriculum";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "COUNSELLOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const course = await prisma.course.findUnique({ where: { id: body.courseId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 400 });

  const joiningDate = body.joiningDate ? new Date(body.joiningDate) : new Date();
  const courseStartDate = body.courseStartDate ? new Date(body.courseStartDate) : joiningDate;
  const expectedCompletionDate = body.expectedCompletionDate
    ? new Date(body.expectedCompletionDate)
    : addDays(courseStartDate, (Number(body.courseDurationMonths) || course.durationMonths) * 30);

  const netFee =
    Number(body.courseFee || 0) + Number(body.registrationFee || 0) - Number(body.discount || 0);
  const rollNumber = body.rollNumber || (await nextRollNumber());

  const student = await prisma.student.create({
    data: {
      rollNumber,
      name: body.name,
      parentName: body.parentName || null,
      mobile: body.mobile,
      altMobile: body.altMobile || null,
      email: body.email || null,
      address: body.address || null,
      qualification: body.qualification || null,
      occupation: body.occupation || null,
      joiningDate,
      dob: body.dob ? new Date(body.dob) : null,
      emergencyContact: body.emergencyContact || null,
      notes: body.notes || null,
      status: body.status || "IN_PROGRESS",
      courseId: body.courseId,
      batchId: body.batchId || null,
      tutorId: body.tutorId || null,
      courseStartDate,
      expectedCompletionDate,
      courseDurationMonths: Number(body.courseDurationMonths || course.durationMonths),
      courseFee: Number(body.courseFee || 0),
      registrationFee: Number(body.registrationFee || 0),
      discount: Number(body.discount || 0),
      netFee,
      paymentType: body.paymentType || "LUMPSUM",
      paymentTerms: body.paymentTerms || null,
    },
  });

  if (Array.isArray(body.availability)) {
    for (const a of body.availability) {
      if (a.day === "" || a.day === undefined) continue;
      await prisma.availability.create({
        data: {
          studentId: student.id,
          dayOfWeek: Number(a.day),
          startTime: a.start || "10:00",
          endTime: a.end || "12:00",
        },
      });
    }
  }

  await mapCurriculumForStudent(student.id, body.courseId);
  await createEmiSchedule({
    studentId: student.id,
    netFee,
    registrationFee: Number(body.registrationFee || 0),
    paymentType: body.paymentType || "LUMPSUM",
    courseStartDate,
  });

  await logAudit({ userId: user.id, action: "STUDENT_CREATE", entity: "Student", entityId: student.id, details: `Direct admission ${rollNumber} — ${student.name} (${course.name})` });
  return NextResponse.json({ student });
}
