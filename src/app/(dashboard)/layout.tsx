import { requireAuth } from "@/lib/auth";
import { getNotificationCount } from "@/lib/notifications";
import { DashboardShell } from "@/components/shell/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const notificationCount = await getNotificationCount();

  return (
    <DashboardShell
      name={user.name}
      email={user.email}
      role={user.role}
      notificationCount={notificationCount}
    >
      {children}
    </DashboardShell>
  );
}
