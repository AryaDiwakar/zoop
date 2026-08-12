import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const MODULE_STATUSES = ["YET_TO_START", "IN_PROGRESS", "COMPLETED"];
const PROJECT_STATUSES = ["YET_TO_START", "IN_PROGRESS", "SUBMITTED", "INTERNAL_FEEDBACK", "REWORK_REQUIRED", "APPROVED"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isStaff = ["SUPER_ADMIN", "TUTOR"].includes(user.role);
  const isStudent = user.role === "STUDENT";
  if (!isStaff && !isStudent)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { type } = body as { type: string };

  try {
    if (type === "module") {
      if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const sm = await prisma.studentModule.findUnique({ where: { id: body.id }, include: { module: true } });
      if (!sm) return NextResponse.json({ error: "Module not found" }, { status: 404 });
      const status = MODULE_STATUSES.includes(body.status) ? body.status : "YET_TO_START";
      await prisma.studentModule.update({
        where: { id: body.id },
        data: { status, completedDate: status === "COMPLETED" ? new Date() : null },
      });
      if (status === "COMPLETED") {
        // start the next module
        const next = await prisma.studentModule.findFirst({
          where: { studentId, module: { courseId: sm.module.courseId, number: { gt: sm.module.number } } },
          orderBy: { module: { number: "asc" } },
        });
        if (next) await prisma.studentModule.update({ where: { id: next.id }, data: { status: "IN_PROGRESS" } });
        const moduleCount = await prisma.module.count({ where: { courseId: sm.module.courseId } });
        const done = await prisma.studentModule.count({ where: { studentId, status: "COMPLETED" } });
        if (done >= moduleCount) await prisma.student.update({ where: { id: studentId }, data: { status: "COMPLETED" } });
      }
      await logAudit({ userId: user.id, action: "PROGRESS_UPDATE", entity: "StudentModule", entityId: body.id, details: `Module ${sm.module.name} → ${status}` });
    } else if (type === "project") {
      const sp = await prisma.studentProject.findUnique({ where: { id: body.id }, include: { project: true } });
      if (!sp) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (isStudent) {
        if (sp.studentId !== studentId)
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        const allowed = ["SUBMITTED"];
        const status = allowed.includes(body.status) ? body.status : "SUBMITTED";
        await prisma.studentProject.update({
          where: { id: body.id },
          data: {
            status,
            submissionDate: sp.submissionDate || new Date(),
            projectLink: body.projectLink ?? sp.projectLink,
            submittedNote: body.submittedNote ?? sp.submittedNote,
          },
        });
        await logAudit({ userId: user.id, action: "PROJECT_STATUS_UPDATE", entity: "StudentProject", entityId: body.id, details: `Student submitted project ${sp.project.name}` });
        return NextResponse.json({ ok: true });
      }
      const status = PROJECT_STATUSES.includes(body.status) ? body.status : "YET_TO_START";
      await prisma.studentProject.update({
        where: { id: body.id },
        data: {
          status,
          submissionDate: ["SUBMITTED", "INTERNAL_FEEDBACK", "REWORK_REQUIRED", "APPROVED"].includes(status) && !sp.submissionDate ? new Date() : sp.submissionDate,
          approvalDate: status === "APPROVED" ? new Date() : null,
          facultyFeedback: body.facultyFeedback ?? sp.facultyFeedback,
          projectLink: body.projectLink ?? sp.projectLink,
        },
      });
      await logAudit({ userId: user.id, action: "PROJECT_STATUS_UPDATE", entity: "StudentProject", entityId: body.id, details: `Project ${sp.project.name} → ${status}` });
    } else if (type === "class") {
      if (!isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const sc = await prisma.studentClass.findUnique({ where: { id: body.id }, include: { class: true } });
      if (!sc) return NextResponse.json({ error: "Class not found" }, { status: 404 });
      await prisma.studentClass.update({
        where: { id: body.id },
        data: { remarks: body.remarks ?? sc.remarks },
      });
      await logAudit({ userId: user.id, action: "PROGRESS_UPDATE", entity: "StudentClass", entityId: body.id, details: "Class note updated" });
    } else {
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
