import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, Table, EmptyState } from "@/components/ui";
import { EMIPaymentButton } from "@/components/student/EMIPaymentButton";
import { ROLES, EMI_STATUS_LABELS, PAYMENT_MODE_LABELS } from "@/lib/constants";
import { formatINR, formatDate, startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils";

export const metadata = { title: "Finance" };

export default async function FinancePage() {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.FINANCE);

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const [todaysCollection, monthlyCollection, outstanding, emisDue, overdue, recentPayments, allEmis] =
    await Promise.all([
      prisma.eMI.aggregate({
        where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: "PAID" },
        _sum: { amountPaid: true },
      }),
      prisma.eMI.aggregate({
        where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "PAID" },
        _sum: { amountPaid: true },
      }),
      prisma.eMI.aggregate({
        where: { status: { in: ["PENDING", "PARTIAL"] } },
        _sum: { balance: true },
      }),
      prisma.eMI.findMany({
        where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "PARTIAL"] } },
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.eMI.findMany({
        where: { dueDate: { lt: todayStart }, status: { in: ["PENDING", "PARTIAL"] } },
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.eMI.findMany({
        where: { paymentDate: { not: null } },
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: { paymentDate: "desc" },
        take: 15,
      }),
      prisma.eMI.findMany({
        include: { student: { select: { id: true, name: true, rollNumber: true } } },
        orderBy: [{ student: { name: "asc" } }, { number: "asc" }],
      }),
    ]);

  const stats = [
    { label: "Today's Collection", value: formatINR(todaysCollection._sum.amountPaid), tone: "green" as const },
    { label: "This Month", value: formatINR(monthlyCollection._sum.amountPaid), tone: "indigo" as const },
    { label: "Outstanding", value: formatINR(outstanding._sum.balance), tone: "red" as const },
    { label: "Due Today", value: emisDue.length, tone: "amber" as const },
    { label: "Overdue", value: overdue.length, tone: "rose" as const },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Finance & Collections" subtitle="EMI tracking, collections and outstanding fees" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.tone === "green" ? "text-emerald-600" : s.tone === "red" || s.tone === "rose" ? "text-rose-600" : s.tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Due & Overdue" subtitle={`${emisDue.length} due today · ${overdue.length} overdue`} className="p-0">
          <Table
            headers={["Student", "EMI", "Due Date", "Amount", "Status", "Collect"]}
            empty={<EmptyState title="All caught up" subtitle="No pending or overdue EMIs." />}
          >
            {[...emisDue, ...overdue].slice(0, 12).map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <a href={`/students/${e.student.id}?tab=finance`} className="text-sm font-medium text-slate-800 hover:text-indigo-600">
                    {e.student.name}
                  </a>
                  <p className="text-[11px] font-mono text-slate-400">{e.student.rollNumber}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600">EMI-{e.number}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.dueDate)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">{formatINR(e.balance)}</td>
                <td className="px-4 py-3">
                  <Badge tone={e.status === "OVERDUE" ? "red" : "amber"}>{EMI_STATUS_LABELS[e.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <EMIPaymentButton
                    emiId={e.id}
                    dueDate={e.dueDate.toISOString()}
                    amount={e.amount}
                    amountPaid={e.amountPaid}
                    status={e.status}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Recent Payments" subtitle="Last 15 collections" className="p-0">
          <Table
            headers={["Student", "EMI", "Paid On", "Amount", "Mode"]}
            empty={<EmptyState title="No payments yet" />}
          >
            {recentPayments.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <a href={`/students/${e.student.id}?tab=finance`} className="text-sm font-medium text-slate-800 hover:text-indigo-600">
                    {e.student.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-xs font-mono text-slate-600">EMI-{e.number}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{e.paymentDate ? formatDate(e.paymentDate) : "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatINR(e.amountPaid)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{e.paymentMode ? PAYMENT_MODE_LABELS[e.paymentMode] || e.paymentMode : "—"}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <Card title="All EMIs" subtitle={`${allEmis.length} installments across all students`} className="p-0">
        <Table
          headers={["Student", "EMI", "Due", "Amount", "Paid", "Balance", "Status"]}
          empty={<EmptyState title="No EMI records" />}
        >
          {allEmis.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <a href={`/students/${e.student.id}?tab=finance`} className="text-sm font-medium text-slate-800 hover:text-indigo-600">
                  {e.student.name}
                </a>
              </td>
              <td className="px-4 py-3 text-xs font-mono text-slate-600">EMI-{e.number}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(e.dueDate)}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{formatINR(e.amount)}</td>
              <td className="px-4 py-3 text-sm text-emerald-600">{formatINR(e.amountPaid)}</td>
              <td className="px-4 py-3 text-sm text-rose-600">{formatINR(e.balance)}</td>
              <td className="px-4 py-3">
                <Badge tone={e.status === "PAID" ? "green" : e.status === "OVERDUE" ? "red" : e.status === "PARTIAL" ? "amber" : "slate"}>
                  {EMI_STATUS_LABELS[e.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
