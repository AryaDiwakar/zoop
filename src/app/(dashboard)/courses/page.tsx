import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Button, Card, Table, Badge, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { ROLES, COURSE_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  await requireRole(ROLES.SUPER_ADMIN);

  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { modules: true, projects: true, students: true, batches: true } },
      modules: { select: { _count: { select: { classes: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalClasses = (c: (typeof courses)[number]) =>
    c.modules.reduce((s, m) => s + m._count.classes, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Course Catalog"
        subtitle={`${courses.length} courses`}
        actions={<Button href="/courses/new">New Course</Button>}
      />

      <Card className="p-0">
        <Table
          headers={["Code", "Course", "Level", "Duration", "Modules", "Classes", "Projects", "Students", "Status", ""]}
          empty={
            courses.length === 0 ? (
              <EmptyState title="No courses yet" subtitle="Create your first course to start mapping curriculum." />
            ) : null
          }
        >
          {courses.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.code}</td>
              <td className="px-4 py-3">
                <Link href={`/courses/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                  {c.name}
                </Link>
                <p className="text-[11px] text-slate-400 max-w-[240px] truncate">{c.description || "—"}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{c.level || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{c.durationMonths} months</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700">{c._count.modules}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700">{totalClasses(c)}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700">{c._count.projects}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700">{c._count.students}</td>
              <td className="px-4 py-3">
                <Badge tone={c.status === "ACTIVE" ? "green" : c.status === "INACTIVE" ? "amber" : "slate"}>
                  {COURSE_STATUS_LABELS[c.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Link href={`/courses/${c.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
