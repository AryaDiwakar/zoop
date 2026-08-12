import Link from "next/link";
import { Avatar } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/constants";
import { Bell, LogOut, Menu } from "lucide-react";

export function Topbar({
  name,
  email,
  role,
  notificationCount,
  onMenu,
}: {
  name: string;
  email: string;
  role: string;
  notificationCount: number;
  onMenu?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden flex items-center gap-2">
          <img src="/zoop-logo.png" alt="Zoop" className="h-7 w-auto object-contain" />
          <span className="text-sm font-bold text-slate-900">Zoop ERP</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {role !== "STUDENT" && (
          <Link
            href="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>
        )}
        <div className="hidden sm:flex items-center gap-2.5">
          <Avatar name={name} />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-[11px] text-slate-400">
              {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role} · {email}
            </p>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-rose-600"
            aria-label="Log out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </header>
  );
}
