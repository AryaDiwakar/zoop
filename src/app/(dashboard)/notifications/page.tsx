import { requireRole } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.TUTOR, ROLES.FINANCE);

  const items = await getNotifications(user);

  const typeTone: Record<string, string> = {
    PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-700",
    PORTFOLIO_ACTIVITY: "bg-violet-100 text-violet-700",
    NEW_ADMISSION: "bg-brand-100 text-brand-700",
    CERTIFICATE_ISSUED: "bg-sky-100 text-sky-700",
    LEAD_FOLLOWUP: "bg-brand-100 text-brand-700",
    TODAY_CLASS: "bg-sky-100 text-sky-700",
    EMI_DUE: "bg-amber-100 text-amber-700",
    EMI_OVERDUE: "bg-rose-100 text-rose-700",
    PORTFOLIO_PENDING: "bg-violet-100 text-violet-700",
    CERTIFICATE_PENDING: "bg-emerald-100 text-emerald-700",
  };

  const typeLabel: Record<string, string> = {
    PAYMENT_RECEIVED: "Payment",
    PORTFOLIO_ACTIVITY: "Portfolio",
    NEW_ADMISSION: "Admission",
    CERTIFICATE_ISSUED: "Certificate",
    LEAD_FOLLOWUP: "Lead follow-up",
    TODAY_CLASS: "Class today",
    EMI_DUE: "EMI due",
    EMI_OVERDUE: "EMI overdue",
    PORTFOLIO_PENDING: "Portfolio",
    CERTIFICATE_PENDING: "Certificate",
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Notifications" subtitle="Actionable alerts generated from live data" />

      <Card title="Activity" subtitle={`${items.length} items`} className="p-0">
        {items.length === 0 && (
          <EmptyState title="All clear" subtitle="No pending follow-ups, classes, EMIs or portfolio items." />
        )}
        <div className="divide-y divide-slate-100">
          {items.map((n) => (
            <a key={n.id} href={n.href} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50">
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeTone[n.type] || "bg-slate-100 text-slate-600"}`}>
                {typeLabel[n.type] || n.type}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500">{n.detail}</p>
              </div>
              <span className="ml-auto shrink-0 text-[11px] text-slate-400">
                {new Date(n.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
