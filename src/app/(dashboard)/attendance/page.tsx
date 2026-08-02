import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, EmptyState, Table } from "@/components/ui";
import { MarkAttendanceButton } from "@/components/student/MarkAttendanceButton";
import { ROLES, ATTENDANCE_STATUS_LABELS } from "@/lib/constants";
import { startOfDay, endOfDay, formatDate } from "@/lib/utils";

export const metadata = { title: "Attendance" };

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const user = await requireRole(ROLES.SUPER_ADMIN, ROLES.TUTOR);
  const sp = await searchParams;

  const day = sp.date ? new Date(sp.date) : new Date();
  const from = startOfDay(day);
  const to = endOfDay(day);

  const whereDate = sp.date
    ? { gte: from, lte: to }
    : { gte: from, lte: to };

  const statusFilter = sp.status && sp.status !== "ALL" ? sp.status : undefined;

  const [todaysClasses, todayStats] = await Promise.all([
    prisma.studentClass.findMany({
      where: {
        plannedDate: whereDate,
        ...(statusFilter ? { attendance: statusFilter } : {}),
        ...(user.role === "TUTOR" ? { tutorId: user.id } : {}),
      },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, course: { select: { name: true } } } },
        class: { include: { module: { include: { course: true } } } },
      },
      orderBy: [{ plannedDate: "asc" }, { class: { module: { number: "asc" } } }, { class: { number: "asc" } }],
    }),
    prisma.studentClass.groupBy({
      by: ["attendance"],
      where: { plannedDate: whereDate, ...(user.role === "TUTOR" ? { tutorId: user.id } : {}) },
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(todayStats.map((s) => [s.attendance, s._count?._all ?? 0]));
  const total = todaysClasses.length;

  const summary = [
    { label: "Scheduled", value: total, tone: "blue" as const },
    { label: "Present", value: counts.PRESENT || 0, tone: "green" as const },
    { label: "Absent", value: counts.ABSENT || 0, tone: "red" as const },
    { label: "Rescheduled", value: (counts.RESCHEDULED || 0) + (counts.CANCELLED || 0), tone: "amber" as const },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Attendance"
        subtitle={`Classes for ${day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
      />

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input type="date" name="date" defaultValue={sp.date || ""} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select name="status" defaultValue={sp.status || "ALL"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="ALL">All Statuses</option>
          {Object.entries(ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">Filter</button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone === "green" ? "text-emerald-600" : s.tone === "red" ? "text-rose-600" : s.tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <Table
          headers={["Student", "Course", "Module", "Class", "Scheduled", "Status", "Mark Attendance", ""]}
          empty={
            total === 0 ? (
              <EmptyState title="No classes scheduled" subtitle="No classes fall on this date, or all are marked." />
            ) : null
          }
        >
          {todaysClasses.map((sc) => (
            <tr key={sc.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{sc.student.name}</p>
                <p className="text-[11px] font-mono text-slate-400">{sc.student.rollNumber}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{sc.student.course?.name || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">M{sc.class.module.number} · {sc.class.module.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">C{sc.class.number} · {sc.class.name}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {sc.plannedDate ? formatDate(sc.plannedDate) : "Not scheduled"}
              </td>
              <td className="px-4 py-3">
                <Badge
                  tone={sc.attendance === "PRESENT" ? "green" : sc.attendance === "ABSENT" ? "red" : sc.attendance === "RESCHEDULED" || sc.attendance === "CANCELLED" ? "amber" : "slate"}
                >
                  {ATTENDANCE_STATUS_LABELS[sc.attendance]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <MarkAttendanceButton
                  studentId={sc.student.id}
                  studentClassId={sc.id}
                  current={sc.attendance}
                />
              </td>
              <td className="px-4 py-3">
                <a href={`/students/${sc.student.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                  Profile
                </a>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
