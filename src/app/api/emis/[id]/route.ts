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
  if (!["SUPER_ADMIN", "FINANCE"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const emi = await prisma.eMI.findUnique({ where: { id }, include: { student: true } });
  if (!emi) return NextResponse.json({ error: "EMI not found" }, { status: 404 });

  const paying = Number(body.amountPaid || 0);
  if (paying <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const totalPaid = emi.amountPaid + paying;
  const newBalance = Math.max(0, emi.amount - totalPaid);
  const status = newBalance === 0 ? "PAID" : "PARTIAL";

  await prisma.eMI.update({
    where: { id },
    data: {
      amountPaid: totalPaid,
      balance: newBalance,
      status,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      receiptNumber: body.receiptNumber || emi.receiptNumber || `RCP-${emi.student.rollNumber.slice(-3)}-${String(emi.number).padStart(2, "0")}`,
      transactionRef: body.transactionRef || emi.transactionRef || null,
      paymentMode: body.paymentMode || emi.paymentMode || "CASH",
      remarks: body.remarks || emi.remarks || null,
    },
  });

  await logAudit({
    userId: user.id,
    action: "EMI_COLLECTION",
    entity: "EMI",
    entityId: id,
    details: `Collected ₹${paying.toLocaleString("en-IN")} for ${emi.student.name} (EMI #${emi.number})`,
  });

  return NextResponse.json({ ok: true, status, balance: newBalance });
}
