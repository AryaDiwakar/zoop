import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "COUNSELLOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const followUp = await prisma.leadFollowUp.create({
    data: {
      leadId: id,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : new Date(),
      discussionNotes: body.discussionNotes || null,
      contactMethod: body.contactMethod || null,
      nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
      counsellorRemarks: body.counsellorRemarks || null,
      userId: user.id,
    },
  });

  if (body.status) {
    await prisma.lead.update({ where: { id }, data: { status: body.status } });
  }

  await logAudit({ userId: user.id, action: "LEAD_FOLLOWUP", entity: "Lead", entityId: id, details: "Added follow-up entry" });
  return NextResponse.json({ followUp });
}
