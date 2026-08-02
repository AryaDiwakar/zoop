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
