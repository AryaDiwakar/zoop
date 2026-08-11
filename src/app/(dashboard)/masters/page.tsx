import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, Table, EmptyState } from "@/components/ui";
import { BatchForm } from "@/components/masters/BatchForm";
import { ROLES, DAYS_OF_WEEK, PAYMENT_MODES, PAYMENT_MODE_LABELS, PAYMENT_TYPES, PAYMENT_TYPE_LABELS, CONTACT_METHODS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Masters" };

export default async function MastersPage() {
  await requireRole(ROLES.SUPER_ADMIN);

  const [batches, courses, tutors] = await Promise.all([
    prisma.batch.findMany({
      include: { course: { select: { name: true } }, tutor: { select: { name: true } }, _count: { select: { students: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({ select: { id: true, name: true }, where: { status: "ACTIVE" } }),
    prisma.user.findMany({ where: { role: "TUTOR" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Masters" subtitle="Batches and reference data" />

      <Card title="Batches" subtitle={`${batches.length} batches`} action={<details className="w-full max-w-sm"><summary className="cursor-pointer text-xs font-medium text-brand-600">+ New Batch</summary><div className="mt-3"><BatchForm courses={courses} tutors={tutors} /></div></details>}>
        <Table
          headers={["Batch", "Course", "Tutor", "Start", "Timings", "Students", "Status"]}
          empty={<EmptyState title="No batches yet" subtitle="Create a batch to group students." />}
        >
          {batches.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium text-slate-800">{b.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{b.course.name}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{b.tutor?.name || "Unassigned"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{b.startDate ? formatDate(b.startDate) : "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{b.timings || "—"}</td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-700">{b._count.students}</td>
              <td className="px-4 py-3">
                <Badge tone={b.status === "ACTIVE" ? "green" : b.status === "UPCOMING" ? "amber" : b.status === "COMPLETED" ? "blue" : "slate"}>{b.status}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Reference Data" subtitle="Fixed options used across the ERP">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Modes</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {PAYMENT_MODES.map((m) => <Badge key={m}>{PAYMENT_MODE_LABELS[m]}</Badge>)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Payment Types</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {PAYMENT_TYPES.map((t) => <Badge key={t}>{PAYMENT_TYPE_LABELS[t]}</Badge>)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contact Methods</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {CONTACT_METHODS.map((m) => <Badge key={m}>{m}</Badge>)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Weekly Availability" subtitle="0 = Sunday … 6 = Saturday (per student)">
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((d, i) => <Badge key={i}>{i} · {d}</Badge>)}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Availability slots are set on each student's profile and drive the auto-rescheduling engine when a class is marked absent.
          </p>
        </Card>
      </div>
    </div>
  );
}
