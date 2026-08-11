import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, Table, EmptyState, Avatar } from "@/components/ui";
import { UserForm } from "@/components/users/UserForm";
import { UserToggle } from "@/components/users/UserToggle";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

export const metadata = { title: "Users & Roles" };

export default async function UsersPage() {
  const current = await requireRole(ROLES.SUPER_ADMIN);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: { student: { select: { name: true, rollNumber: true } } },
  });

  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, rollNumber: true },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Users & Roles" subtitle={`${users.length} accounts`} />

      <Card>
        <UserForm students={students} />
      </Card>

      <Card title="Accounts" className="p-0">
        <Table
          headers={["User", "Email", "Role", "Status", ""]}
          empty={<EmptyState title="No users" />}
        >
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    {u.role === "STUDENT" ? (
                      <p className="text-[11px] text-slate-400">
                        {u.student ? `→ ${u.student.name} (${u.student.rollNumber})` : "Not mapped"}
                      </p>
                    ) : (
                      <p className="text-[11px] font-mono text-slate-400">{u.id.slice(-6).toUpperCase()}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{u.email}</td>
              <td className="px-4 py-3">
                <Badge tone={u.role === "SUPER_ADMIN" ? "violet" : u.role === "TUTOR" ? "blue" : u.role === "FINANCE" ? "teal" : u.role === "STUDENT" ? "brand" : "brand"}>
                  {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={u.active ? "green" : "slate"}>{u.active ? "Active" : "Deactivated"}</Badge>
              </td>
              <td className="px-4 py-3">
                {u.id !== current.id && (
                  <UserToggle userId={u.id} active={u.active} />
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
