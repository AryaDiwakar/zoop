import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, ProgressBar, Table, EmptyState } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { formatINR, startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.FINANCE);

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const [
    byCourse,
    byTutor,
    byModule,
    leadSources,
    leadFunnel,
    attendanceAgg,
    courseStudents,
    monthlyPaid,
  ] = await Promise.all([
    prisma.student.groupBy({
      by: ["courseId"],
      _count: { _all: true },
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD", "COMPLETED"] } },
    }),
    prisma.student.groupBy({
      by: ["tutorId"],
      _count: { _all: true },
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD"] } },
    }),
    prisma.studentModule.groupBy({
      by: ["moduleId"],
      _count: { _all: true },
      where: { status: "IN_PROGRESS" },
    }),
    prisma.lead.groupBy({
      by: ["leadSource"],
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.studentClass.groupBy({
      by: ["attendance"],
      _count: { _all: true },
      where: { attendance: { in: ["PRESENT", "ABSENT", "RESCHEDULED", "CANCELLED"] } },
    }),
    prisma.course.findMany({ select: { id: true, name: true } }),
    prisma.eMI.aggregate({
      where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "PAID" },
      _sum: { amountPaid: true },
    }),
  ]);

  const courseNames = new Map(courseStudents.map((c) => [c.id, c.name]));
  const totalCourseStudents = byCourse.reduce((s, b) => s + (b._count?._all ?? 0), 0);

  const leadTotal = leadFunnel.reduce((s, b) => s + (b._count?._all ?? 0), 0);
  const converted = leadFunnel.find((b) => b.status === "CONVERTED")?._count?._all ?? 0;

  const attTotal = attendanceAgg.reduce((s, b) => s + (b._count?._all ?? 0), 0);
  const attPresent = attendanceAgg.find((b) => b.attendance === "PRESENT")?._count?._all ?? 0;
  const attAbsent = attendanceAgg.find((b) => b.attendance === "ABSENT")?._count?._all ?? 0;
  const attRescheduled = attendanceAgg.find((b) => b.attendance === "RESCHEDULED")?._count?._all ?? 0;
  const attendanceRate = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0;

  const topCourses = byCourse
    .map((b) => ({ name: courseNames.get(b.courseId) || "Unknown", count: b._count?._all ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const leadSourceMax = Math.max(0, ...leadSources.map((b) => b._count?._all ?? 0));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Enrollment, conversion, attendance and collections analytics" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Students by Course" subtitle={`${totalCourseStudents} enrolled`}>
          {topCourses.length === 0 && <p className="text-sm text-slate-400">No enrollments yet.</p>}
          <div className="space-y-3">
            {topCourses.map((c) => {
              const pct = totalCourseStudents > 0 ? (c.count / totalCourseStudents) * 100 : 0;
              return (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.name}</span>
                    <span className="font-semibold text-slate-900">{c.count}</span>
                  </div>
                  <ProgressBar value={pct} tone={pct > 50 ? "green" : "indigo"} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Lead Sources" subtitle={`${leadTotal} total leads`}>
          <div className="space-y-3">
            {leadSources.map((b) => {
              const pct = leadSourceMax > 0 ? ((b._count?._all ?? 0) / leadSourceMax) * 100 : 0;
              return (
                <div key={b.leadSource}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{b.leadSource.replace(/_/g, " ")}</span>
                    <span className="font-semibold text-slate-900">{b._count?._all ?? 0}</span>
                  </div>
                  <ProgressBar value={pct} tone="violet" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Conversion Funnel" subtitle={`${converted}/${leadTotal} converted`}>
          <div className="space-y-2">
            {leadFunnel
              .sort((a, b) => (b._count?._all ?? 0) - (a._count?._all ?? 0))
              .map((b) => (
                <div key={b.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <span className="font-medium text-slate-700">{b.status.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-slate-900">{b._count?._all ?? 0}</span>
                </div>
              ))}
          </div>
        </Card>

        <Card title="Attendance Overview" subtitle={`${attendanceRate}% overall attendance`}>
          <div className="mb-3">
            <ProgressBar value={attendanceRate} tone={attendanceRate > 75 ? "green" : attendanceRate > 50 ? "amber" : "red"} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <p className="font-semibold text-emerald-700">Present</p>
              <p className="text-emerald-900">{attPresent}</p>
            </div>
            <div className="rounded-lg bg-rose-50 px-3 py-2">
              <p className="font-semibold text-rose-700">Absent</p>
              <p className="text-rose-900">{attAbsent}</p>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-2">
              <p className="font-semibold text-amber-700">Rescheduled</p>
              <p className="text-amber-900">{attRescheduled}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-700">Total Marked</p>
              <p className="text-slate-900">{attTotal}</p>
            </div>
          </div>
        </Card>

        <Card title="Collections" subtitle="Current month">
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-xs font-medium text-emerald-700">Collected this month</span>
              <span className="text-sm font-bold text-emerald-800">{formatINR(monthlyPaid._sum.amountPaid)}</span>
            </div>
            <p className="text-[11px] text-slate-400">Up-to-date EMI receipts are listed in the Finance page.</p>
          </div>
          <Badge tone="green">{attTotal > 0 ? "Healthy" : "No data"}</Badge>
        </Card>
      </div>
    </div>
  );
}
