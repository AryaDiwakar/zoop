import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const STATUSES = ["YET_TO_START", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "APPROVED"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["SUPER_ADMIN", "TUTOR"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const portfolio = await prisma.portfolio.findUnique({ where: { studentId } });
  if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

  const status = STATUSES.includes(body.status) ? body.status : portfolio.status;
  const now = new Date();

  await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: {
      status,
      behanceLink: body.behanceLink ?? portfolio.behanceLink,
      dribbbleLink: body.dribbbleLink ?? portfolio.dribbbleLink,
      websiteLink: body.websiteLink ?? portfolio.websiteLink,
      pdfUrl: body.pdfUrl ?? portfolio.pdfUrl,
      facultyReview: body.facultyReview ?? portfolio.facultyReview,
      submittedAt: ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(status) && !portfolio.submittedAt ? now : portfolio.submittedAt,
      reviewedAt: ["UNDER_REVIEW", "APPROVED"].includes(status) ? now : portfolio.reviewedAt,
    },
  });

  await logAudit({ userId: user.id, action: "PORTFOLIO_UPDATE", entity: "Portfolio", entityId: portfolio.id, details: `Portfolio → ${status}` });
  return NextResponse.json({ ok: true });
}
