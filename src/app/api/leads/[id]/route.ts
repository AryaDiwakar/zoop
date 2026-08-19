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
  if (!["SUPER_ADMIN", "COUNSELLOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      leadDate: body.leadDate ? new Date(body.leadDate) : undefined,
      studentName: body.studentName,
      parentName: body.parentName ?? null,
      mobile: body.mobile,
      altMobile: body.altMobile ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      qualification: body.qualification ?? null,
      college: body.college ?? null,
      interestedCourse: body.interestedCourse ?? null,
      leadSource: body.leadSource,
      remarks: body.remarks ?? null,
      status: body.status,
      counsellorId: body.counsellorId ?? null,
    },
  });

  await logAudit({ userId: user.id, action: "LEAD_UPDATE", entity: "Lead", entityId: id, details: `Updated lead — ${lead.studentName} (status: ${lead.status})` });
  return NextResponse.json({ lead });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { convertedStudent: { select: { id: true } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.convertedStudent)
    return NextResponse.json({ error: "Cannot delete a converted lead" }, { status: 400 });

  const name = lead.studentName;
  await prisma.lead.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "LEAD_DELETE", entity: "Lead", entityId: id, details: `Deleted lead — ${name}` });
  return NextResponse.json({ ok: true });
}
