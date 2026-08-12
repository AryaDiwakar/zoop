import { requireAuth } from "@/lib/auth";
import { getNotificationCount } from "@/lib/notifications";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { ROLES } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if (user.role === ROLES.STUDENT && !user.studentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm rounded-xl bg-white p-6 text-center shadow">
          <p className="text-sm font-medium text-slate-800">No student mapped to this account</p>
          <p className="mt-1 text-xs text-slate-500">
            Contact the administrator to link this login to a student profile.
          </p>
        </div>
      </div>
    );
  }

  const notificationCount = await getNotificationCount(user);

  return (
    <DashboardShell
      name={user.name}
      email={user.email}
      role={user.role}
      studentId={user.studentId ?? undefined}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardShell>
  );
}
