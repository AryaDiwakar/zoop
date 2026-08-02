import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, Button, Card, Badge, EmptyState } from "@/components/ui";
import { ROLES, COURSE_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export const metadata = { title: "Course" };

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN);
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { number: "asc" },
        include: {
          classes: { orderBy: { number: "asc" } },
          projects: true,
          _count: { select: { studentModules: true } },
        },
      },
      students: { select: { id: true, name: true, rollNumber: true, status: true } },
    },
  });
  if (!course) notFound();

  const totalClasses = course.modules.reduce((s, m) => s + m.classes.length, 0);
  const totalProjects = course.modules.reduce((s, m) => s + m.projects.length, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={course.name}
        subtitle={`${course.code} · ${course.durationMonths} months · ${course.level || "All levels"}`}
        actions={
          <>
            <Badge tone={course.status === "ACTIVE" ? "green" : "amber"}>{COURSE_STATUS_LABELS[course.status]}</Badge>
            <Button href={`/courses/${course.id}/edit`} variant="outline">Edit</Button>
            <Button href="/courses/new">New Course</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Modules" className="p-4"><p className="text-2xl font-bold">{course.modules.length}</p></Card>
        <Card title="Classes" className="p-4"><p className="text-2xl font-bold">{totalClasses}</p></Card>
        <Card title="Projects" className="p-4"><p className="text-2xl font-bold">{totalProjects}</p></Card>
        <Card title="Students" className="p-4"><p className="text-2xl font-bold">{course.students.length}</p></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {course.description && (
          <Card title="Description"><p className="text-sm text-slate-600">{course.description}</p></Card>
        )}
        <Card title="Details">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Learning Pattern</dt><dd className="text-slate-800">{course.learningPattern || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Software</dt><dd className="text-slate-800">{course.softwareUsed.length ? course.softwareUsed.join(", ") : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">AI Tools</dt><dd className="text-slate-800">{course.aiTools.length ? course.aiTools.join(", ") : "—"}</dd></div>
          </dl>
        </Card>
      </div>

      <Card
        title="Curriculum"
        subtitle={`${course.modules.length} modules`}
        action={<Button href={`/curriculum?course=${course.id}`} size="sm" variant="outline">Manage Curriculum</Button>}
        className="p-0"
      >
        <div className="divide-y divide-slate-100">
          {course.modules.length === 0 && (
            <EmptyState title="No modules mapped" subtitle="Add modules via the Curriculum page." />
          )}
          {course.modules.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  M{m.number} · {m.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {m.classes.length} classes · {m.projects.length} projects · {m._count.studentModules} students on this module
                </p>
              </div>
              <div className="flex shrink-0 gap-3 text-[11px] font-medium text-slate-500">
                <span>{m.totalClasses} planned</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Enrolled Students" subtitle={`${course.students.length} students`} className="p-0">
        <div className="divide-y divide-slate-100">
          {course.students.length === 0 && (
            <EmptyState title="No enrollments yet" subtitle="Converted leads will appear here." />
          )}
          {course.students.map((s) => (
            <Link key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.name}</p>
                <p className="text-[11px] font-mono text-slate-400">{s.rollNumber}</p>
              </div>
              <Badge tone={s.status === "ACTIVE" || s.status === "IN_PROGRESS" ? "green" : s.status === "COMPLETED" ? "blue" : "slate"}>{s.status}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
