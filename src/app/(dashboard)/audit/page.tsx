import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Table, EmptyState, Badge, Avatar } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit Trail" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; q?: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN);
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.entity && sp.entity !== "ALL") where.entity = sp.entity;
  if (sp.q) where.details = { contains: sp.q, mode: "insensitive" };

  const [logs, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.auditLog.groupBy({ by: ["entity"], _count: { _all: true } }),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Audit Trail" subtitle="Immutable log of actions across the system" />

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <select name="entity" defaultValue={sp.entity || "ALL"} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="ALL">All Entities</option>
          {entities.map((e) => (
            <option key={e.entity} value={e.entity}>{e.entity} ({e._count?._all ?? 0})</option>
          ))}
        </select>
        <input name="q" defaultValue={sp.q} placeholder="Search details…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">Filter</button>
      </form>

      <Card title={`Log Entries · ${logs.length}`} className="p-0">
        <Table
          headers={["Time", "User", "Action", "Entity", "Details"]}
          empty={<EmptyState title="No log entries" subtitle="Actions will appear here as they happen." />}
        >
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={l.user?.name || "System"} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{l.user?.name || "System"}</p>
                    <p className="text-[10px] text-slate-400">{l.user?.role || "—"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={l.action.includes("DELETE") ? "red" : l.action.includes("CREATE") ? "green" : l.action.includes("LOGIN") || l.action.includes("LOGOUT") ? "slate" : "brand"}>
                  {l.action}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs font-mono text-slate-600">{l.entity}</td>
              <td className="px-4 py-3 text-xs text-slate-600">{l.details || "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
