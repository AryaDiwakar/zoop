import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Button, Select, Input, Card, Table, EmptyState, Avatar, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { STUDENT_STATUSES, STUDENT_STATUS_LABELS, ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; course?: string; tutor?: string; batch?: string }>;
}) {
  const user = await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.TUTOR, ROLES.FINANCE);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.status && sp.status !== "ALL") where.status = sp.status;
  if (sp.course && sp.course !== "ALL") where.courseId = sp.course;
  if (sp.tutor && sp.tutor !== "ALL") where.tutorId = sp.tutor;
  if (sp.batch && sp.batch !== "ALL") where.batchId = sp.batch;
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: "insensitive" } },
      { rollNumber: { contains: sp.q, mode: "insensitive" } },
      { mobile: { contains: sp.q } },
    ];
  }

  const [students, courses, tutors, batches] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        course: { select: { name: true } },
        tutor: { select: { name: true } },
        batch: { select: { name: true } },
        portfolios: true,
        _count: { select: { studentClasses: { where: { attendance: "PRESENT" } } } },
      },
      orderBy: { joiningDate: "desc" },
    }),
    prisma.course.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: "TUTOR" }, select: { id: true, name: true } }),
    prisma.batch.findMany({ select: { id: true, name: true } }),
  ]);

  const param = (k: string) => (sp as Record<string, string | undefined>)[k] || "ALL";
  const isAdminOrCounsellor = ["SUPER_ADMIN", "COUNSELLOR"].includes(user.role);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        subtitle={`${students.length} students`}
        actions={isAdminOrCounsellor ? <Button href="/students/new">New Student</Button> : undefined}
      />

      <form className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Input name="q" defaultValue={sp.q} placeholder="Search name, roll number, mobile…" />
        </div>
        <Select name="status" defaultValue={param("status")}>
          <option value="ALL">All Statuses</option>
          {STUDENT_STATUSES.map((s) => (
            <option key={s} value={s}>{STUDENT_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select name="course" defaultValue={param("course")}>
          <option value="ALL">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select name="tutor" defaultValue={param("tutor")}>
          <option value="ALL">All Tutors</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Select name="batch" defaultValue={param("batch")}>
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">Filter</Button>
        </div>
      </form>

      <Card className="p-0">
        <Table
          headers={["Roll No", "Student", "Course", "Batch", "Tutor", "Joining", "Classes Done", "Status", ""]}
          empty={
            students.length === 0 ? (
              <EmptyState title="No students found" subtitle="Try adjusting your filters or add a new student." />
            ) : null
          }
        >
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{s.rollNumber}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={s.name} size="sm" />
                  <div>
                    <Link href={`/students/${s.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                      {s.name}
                    </Link>
                    <p className="text-[11px] text-slate-400">{s.mobile}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.course.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.batch?.name || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.tutor?.name || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(s.joiningDate)}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{s._count.studentClasses}</td>
              <td className="px-4 py-3">
                {s.portfolios.length === 0 ? <StatusBadge status={s.status} /> : (
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={s.status} />
                    <Badge tone={s.portfolios[0].status === "APPROVED" ? "green" : "amber"}>PF: {s.portfolios[0].status.replace(/_/g, " ")}</Badge>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <Link href={`/students/${s.id}`} className="text-xs font-medium text-brand-600 hover:underline">
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
