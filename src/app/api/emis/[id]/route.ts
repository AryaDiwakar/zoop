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

  const receiptNumber =
    body.receiptNumber || emi.receiptNumber || `RCP-${emi.student.rollNumber.slice(-3)}-${String(emi.number).padStart(2, "0")}`;
  const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.eMI.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!current) throw new Error("EMI not found");

    const thisEmiPaid = Math.min(current.amount - current.amountPaid, paying);
    const newAmountPaid = current.amountPaid + thisEmiPaid;
    const newBalance = current.amount - newAmountPaid;
    const status = newBalance === 0 ? "PAID" : "PARTIAL";

    await tx.eMI.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status,
        paymentDate,
        receiptNumber,
        transactionRef: body.transactionRef || current.transactionRef || null,
        paymentMode: body.paymentMode || current.paymentMode || "CASH",
        remarks: body.remarks || current.remarks || null,
      },
    });

    let excess = paying - thisEmiPaid;

    if (excess > 0) {
      const upcoming = await tx.eMI.findMany({
        where: { studentId: current.studentId, id: { not: id }, balance: { gt: 0 } },
        orderBy: { number: "asc" },
      });
      const totalOutstanding = upcoming.reduce((s, e) => s + e.balance, 0);
      if (excess > totalOutstanding) {
        throw new Error(`Payment exceeds total outstanding by ₹${(excess - totalOutstanding).toLocaleString("en-IN")}`);
      }
      for (const next of upcoming) {
        if (excess <= 0) break;
        const take = Math.min(next.balance, excess);
        const nextPaid = next.amountPaid + take;
        const nextBalance = next.amount - nextPaid;
        await tx.eMI.update({
          where: { id: next.id },
          data: {
            amountPaid: nextPaid,
            balance: nextBalance,
            status: nextBalance === 0 ? "PAID" : "PARTIAL",
          },
        });
        excess -= take;
      }
    }

    return { balance: newBalance, status };
  }).catch((err: Error) => {
    if (err.message.startsWith("Payment exceeds")) return { error: err.message };
    throw err;
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await logAudit({
    userId: user.id,
    action: "EMI_COLLECTION",
    entity: "EMI",
    entityId: id,
    details: `Collected ₹${paying.toLocaleString("en-IN")} for ${emi.student.name} (EMI #${emi.number})`,
  });

  return NextResponse.json({ ok: true, status: result.status, balance: result.balance });
}
