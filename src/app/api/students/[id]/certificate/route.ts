import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const STATUSES = ["NOT_ELIGIBLE", "ELIGIBLE", "GENERATED", "ISSUED"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const cert = await prisma.certificate.findUnique({ where: { studentId } });
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  const status = STATUSES.includes(body.status) ? body.status : cert.status;
  const nextNum = cert.certificateNumber || `ZOO-CERT-${String(Math.floor(1000 + Math.random() * 9000))}`;

  await prisma.certificate.update({
    where: { id: cert.id },
    data: {
      status,
      certificateNumber: status === "GENERATED" || status === "ISSUED" ? nextNum : null,
      issueDate: status === "ISSUED" ? new Date() : cert.issueDate,
      issuedById: status === "ISSUED" ? user.id : cert.issuedById,
      remarks: body.remarks ?? cert.remarks,
    },
  });

  if (status === "ISSUED") {
    await prisma.student.update({ where: { id: studentId }, data: { status: "CERTIFICATE_ISSUED" } });
  }

  await logAudit({ userId: user.id, action: "CERTIFICATE_ISSUE", entity: "Certificate", entityId: cert.id, details: `Certificate → ${status} (${nextNum})` });
  return NextResponse.json({ ok: true, certificateNumber: nextNum });
}
