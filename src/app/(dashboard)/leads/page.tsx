import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Button, Select, Input, Card, Table, EmptyState, Avatar } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; counsellor?: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.status && sp.status !== "ALL") where.status = sp.status;
  if (sp.source && sp.source !== "ALL") where.leadSource = sp.source;
  if (sp.counsellor && sp.counsellor !== "ALL") where.counsellorId = sp.counsellor;
  if (sp.q) {
    where.OR = [
      { studentName: { contains: sp.q, mode: "insensitive" } },
      { mobile: { contains: sp.q } },
      { email: { contains: sp.q, mode: "insensitive" } },
    ];
  }

  const [leads, counsellors] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { counsellor: { select: { name: true } }, followUps: { orderBy: { followUpDate: "desc" }, take: 1 }, convertedStudent: { select: { id: true, rollNumber: true } } },
      orderBy: { leadDate: "desc" },
    }),
    prisma.user.findMany({ where: { role: "COUNSELLOR" }, select: { id: true, name: true } }),
  ]);

  const param = (k: string) => (sp as Record<string, string | undefined>)[k] || "ALL";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Lead Management"
        subtitle={`${leads.length} leads`}
        actions={<Button href="/leads/new">New Lead</Button>}
      />

      <form className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input name="q" defaultValue={sp.q} placeholder="Search name, mobile, email…" />
        </div>
        <Select name="status" defaultValue={param("status")}>
          <option value="ALL">All Statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select name="source" defaultValue={param("source")}>
          <option value="ALL">All Sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Select name="counsellor" defaultValue={param("counsellor")}>
            <option value="ALL">All Counsellors</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">Filter</Button>
        </div>
      </form>

      <Card className="p-0">
        <Table
          headers={["Lead ID", "Date", "Student", "Contact", "Interested Course", "Source", "Counsellor", "Status", "Next Follow-up", ""]}
          empty={
            leads.length === 0 ? (
              <EmptyState title="No leads found" subtitle="Try adjusting your filters or create a new lead." />
            ) : null
          }
        >
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{lead.id.slice(-6).toUpperCase()}</td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(lead.leadDate)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={lead.studentName} size="sm" />
                  <div>
                    <Link href={`/leads/${lead.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                      {lead.studentName}
                    </Link>
                    <p className="text-[11px] text-slate-400">{lead.parentName || "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                {lead.mobile}
                {lead.convertedStudent && (
                  <span className="ml-1 text-[10px] font-semibold text-emerald-600">→ {lead.convertedStudent.rollNumber}</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{lead.interestedCourse || "—"}</td>
              <td className="px-4 py-3"><StatusBadge status={lead.leadSource} /></td>
              <td className="px-4 py-3 text-xs text-slate-600">{lead.counsellor?.name || "Unassigned"}</td>
              <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                {lead.followUps[0]?.nextFollowUpDate ? formatDate(lead.followUps[0].nextFollowUpDate) : "—"}
              </td>
              <td className="px-4 py-3">
                <Link href={`/leads/${lead.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
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
