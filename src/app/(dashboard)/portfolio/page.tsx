import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, Table, EmptyState, ProgressBar } from "@/components/ui";
import { ProjectStatusControl } from "@/components/student/ProjectStatusControl";
import { ROLES, PROJECT_STATUS_LABELS, PORTFOLIO_STATUS_LABELS, MODULE_STATUS_LABELS } from "@/lib/constants";

export const metadata = { title: "Projects & Portfolio" };

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.TUTOR);
  const sp = await searchParams;

  const statusFilter = sp.status && sp.status !== "ALL" ? sp.status : undefined;

  const [students, projectStats] = await Promise.all([
    prisma.student.findMany({
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD"] } },
      include: {
        course: { select: { name: true } },
        portfolios: true,
        studentModules: { include: { module: true }, orderBy: { module: { number: "asc" } } },
        studentProjects: {
          include: { project: { include: { module: true } } },
          orderBy: { project: { module: { number: "asc" } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.studentProject.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(projectStats.map((s) => [s.status, s._count?._all ?? 0]));
  const totalProjects = students.reduce((s, st) => s + st.studentProjects.length, 0);

  const filtered = statusFilter
    ? students.filter((st) => st.studentProjects.some((p) => p.status === statusFilter))
    : students;

  const tabs = [
    { label: "All", value: "ALL" },
    ...Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => ({ label: v, value: k })),
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Projects & Portfolio" subtitle="Track project progress and portfolio readiness" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Total Projects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalProjects}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Approved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{statusCounts.APPROVED || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">In Progress</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{statusCounts.IN_PROGRESS || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Submitted / Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{(statusCounts.SUBMITTED || 0) + (statusCounts.INTERNAL_FEEDBACK || 0) + (statusCounts.REWORK_REQUIRED || 0)}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/portfolio${t.value === "ALL" ? "" : `?status=${t.value}`}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (sp.status || "ALL") === t.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card><EmptyState title="No students" subtitle="No students match this filter." /></Card>
        )}

        {filtered.map((st) => {
          const total = st.studentModules.length;
          const done = st.studentModules.filter((m) => m.status === "COMPLETED").length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const portfolio = st.portfolios[0];
          return (
            <Card key={st.id} title={st.name} subtitle={`${st.rollNumber} · ${st.course?.name || "—"}`}>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                    <span>Course progress</span>
                    <span className="font-semibold">{done}/{total} modules · {pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct === 100 ? "green" : "indigo"} />
                </div>
                {portfolio && (
                  <Badge tone={portfolio.status === "APPROVED" ? "green" : portfolio.status === "SUBMITTED" || portfolio.status === "UNDER_REVIEW" ? "amber" : "slate"}>
                    Portfolio: {PORTFOLIO_STATUS_LABELS[portfolio.status]}
                  </Badge>
                )}
              </div>

              <Table
                headers={["Project", "Module", "Status", "Feedback & Link", ""]}
                empty={<EmptyState title="No projects assigned" />}
              >
                {st.studentProjects.map((spItem) => (
                  <tr key={spItem.id} className="align-top hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{spItem.project.name}</p>
                      {spItem.project.description && (
                        <p className="text-[11px] text-slate-400 max-w-[280px] truncate">{spItem.project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {spItem.project.module ? `M${spItem.project.module.number} · ${spItem.project.module.name}` : "Cross-module"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={spItem.status === "APPROVED" ? "green" : spItem.status === "IN_PROGRESS" ? "indigo" : spItem.status === "YET_TO_START" ? "slate" : "amber"}
                      >
                        {PROJECT_STATUS_LABELS[spItem.status]}
                      </Badge>
                    </td>
                    <td className="w-64 px-4 py-3">
                      <ProjectStatusControl
                        studentId={st.id}
                        id={spItem.id}
                        current={spItem.status}
                        facultyFeedback={spItem.facultyFeedback}
                        projectLink={spItem.projectLink}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/students/${st.id}?tab=portfolio`} className="text-xs font-medium text-indigo-600 hover:underline">Profile</a>
                    </td>
                  </tr>
                ))}
              </Table>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
