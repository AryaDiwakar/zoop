import { getDashboardStats } from "@/lib/stats";
import { getNotifications } from "@/lib/notifications";
import { requireAuth } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { redirect } from "next/navigation";
import { StatCard, Card } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR, monthLabel } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  UserPlus,
  CalendarClock,
  BadgeCheck,
  TrendingUp,
  GraduationCap,
  UserCheck,
  FileCheck2,
  Award,
  Clock,
  CalendarDays,
  FolderKanban,
  ClipboardCheck,
  Wallet,
  IndianRupee,
  AlertTriangle,
  BellRing,
} from "lucide-react";

const TODAY = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function DashboardPage() {
  const user = await requireAuth();
  if (user.role === ROLES.STUDENT) {
    if (user.studentId) redirect(`/students/${user.studentId}`);
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No student profile is linked to this account yet.
      </div>
    );
  }
  const stats = await getDashboardStats();
  const notifications = (await getNotifications(user)).slice(0, 8);

  const leadBadge = (label: string, value: string | number) => (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">{TODAY}</p>
        </div>
        <Link
          href="/leads/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <UserPlus className="h-4 w-4" /> New Lead
        </Link>
      </div>

      {/* Lead Statistics */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Lead Statistics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total Leads" value={stats.leads.total} icon={<Users className="h-5 w-5" />} tone="brand" link="/leads" />
          <StatCard label="New Leads Today" value={stats.leads.newToday} icon={<UserPlus className="h-5 w-5" />} tone="blue" link="/leads" />
          <StatCard label="Follow-up Today" value={stats.leads.followUpToday} icon={<CalendarClock className="h-5 w-5" />} tone="amber" link="/leads" />
          <StatCard label="Leads Converted" value={stats.leads.converted} icon={<BadgeCheck className="h-5 w-5" />} tone="green" link="/leads" />
          <StatCard label="Conversion" value={`${stats.leads.conversionPercent}%`} icon={<TrendingUp className="h-5 w-5" />} tone="teal" />
        </div>
      </section>

      {/* Student Statistics */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Student Statistics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Active Students" value={stats.students.active} icon={<GraduationCap className="h-5 w-5" />} tone="brand" link="/students" />
          <StatCard label="New Admissions" value={stats.students.newAdmissions} icon={<UserPlus className="h-5 w-5" />} tone="blue" link="/students" />
          <StatCard label="In Progress" value={stats.students.inProgress} icon={<UserCheck className="h-5 w-5" />} tone="violet" link="/students" />
          <StatCard label="Completed" value={stats.students.completed} icon={<FileCheck2 className="h-5 w-5" />} tone="green" link="/students" />
          <StatCard label="Certificate Pending" value={stats.students.certificatePending} icon={<Clock className="h-5 w-5" />} tone="amber" link="/students" />
          <StatCard label="Certificate Issued" value={stats.students.certificateIssued} icon={<Award className="h-5 w-5" />} tone="teal" link="/students" />
        </div>
      </section>

      {/* Academic Statistics */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Academic Statistics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Today's Classes" value={stats.academic.todaysClasses} icon={<CalendarDays className="h-5 w-5" />} tone="blue" link="/attendance" />
          <StatCard label="Classes Pending" value={stats.academic.classesPending} icon={<Clock className="h-5 w-5" />} tone="amber" link="/students" />
          <StatCard label="Projects Pending" value={stats.academic.projectsPending} icon={<FolderKanban className="h-5 w-5" />} tone="violet" link="/portfolio" />
          <StatCard label="Portfolio Pending" value={stats.academic.portfolioPending} icon={<ClipboardCheck className="h-5 w-5" />} tone="brand" link="/portfolio" />
          <StatCard label="Ready for Final Review" value={stats.academic.readyForFinalReview} icon={<BadgeCheck className="h-5 w-5" />} tone="green" link="/portfolio" />
        </div>
      </section>

      {/* Finance Statistics */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Finance Statistics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Today's Collection" value={formatINR(stats.finance.todaysCollection)} icon={<Wallet className="h-5 w-5" />} tone="green" link="/finance" />
          <StatCard label={`Collection · ${monthLabel()}`} value={formatINR(stats.finance.monthlyCollection)} icon={<IndianRupee className="h-5 w-5" />} tone="blue" link="/finance" />
          <StatCard label="Outstanding Fees" value={formatINR(stats.finance.outstandingFees)} icon={<Wallet className="h-5 w-5" />} tone="amber" link="/finance" />
          <StatCard label="EMIs Due Today" value={stats.finance.emisDueToday} icon={<CalendarClock className="h-5 w-5" />} tone="violet" link="/finance" />
          <StatCard label="Overdue EMIs" value={stats.finance.overdueEmis} icon={<AlertTriangle className="h-5 w-5" />} tone="red" link="/finance" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course statistics */}
        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
          <Card title="Students by Course">
            <div className="space-y-2.5">
              {stats.courseStats.byCourse.length === 0 && (
                <p className="text-sm text-slate-400">No active enrollments yet.</p>
              )}
              {stats.courseStats.byCourse.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{c.name}</span>
                    <span className="text-slate-400">{c.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{
                        width: `${(c.count / Math.max(1, stats.courseStats.byCourse[0].count)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Students by Tutor">
            <div className="space-y-2.5">
              {stats.courseStats.byTutor.length === 0 && (
                <p className="text-sm text-slate-400">No students assigned yet.</p>
              )}
              {stats.courseStats.byTutor.map((t) => (
                <div key={t.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">{t.name}</span>
                    <span className="text-slate-400">{t.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${(t.count / Math.max(1, stats.courseStats.byTutor[0].count)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Students by Current Module" className="sm:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {stats.courseStats.byModule.length === 0 && (
                <p className="text-sm text-slate-400">No module in progress.</p>
              )}
              {stats.courseStats.byModule.map((m) => (
                <div key={m.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="truncate text-xs text-slate-600">{m.name}</span>
                  <span className="ml-2 text-sm font-semibold text-slate-800">{m.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <Card
          title="Reminders & Alerts"
          subtitle="Follow-ups, dues and pending tasks"
          action={
            <Link href="/notifications" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-2">
            {notifications.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">All caught up!</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="block rounded-lg border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex items-start gap-2">
                  <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.detail}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
