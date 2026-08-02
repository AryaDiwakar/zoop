import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "COUNSELLOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const lead = await prisma.lead.create({
    data: {
      leadDate: body.leadDate ? new Date(body.leadDate) : new Date(),
      studentName: body.studentName,
      parentName: body.parentName || null,
      mobile: body.mobile,
      altMobile: body.altMobile || null,
      email: body.email || null,
      address: body.address || null,
      qualification: body.qualification || null,
      college: body.college || null,
      interestedCourse: body.interestedCourse || null,
      leadSource: body.leadSource || "OTHER",
      counsellorId: user.role === "COUNSELLOR" ? user.id : body.counsellorId || null,
      remarks: body.remarks || null,
      status: body.status || "NEW",
    },
  });

  if (body.followUp) {
    await prisma.leadFollowUp.create({
      data: {
        leadId: lead.id,
        followUpDate: new Date(),
        discussionNotes: body.followUp.discussionNotes || null,
        contactMethod: body.followUp.contactMethod || null,
        nextFollowUpDate: body.followUp.nextFollowUpDate ? new Date(body.followUp.nextFollowUpDate) : null,
        counsellorRemarks: body.followUp.counsellorRemarks || null,
        userId: user.id,
      },
    });
  }

  await logAudit({ userId: user.id, action: "LEAD_CREATE", entity: "Lead", entityId: lead.id, details: `Created lead — ${lead.studentName}` });
  return NextResponse.json({ lead });
}
