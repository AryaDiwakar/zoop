"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  FolderKanban,
  Wallet,
  BellRing,
  FileBarChart,
  Settings2,
  ShieldCheck,
  UserCog,
  IdCard,
} from "lucide-react";
import { Role, ROLES } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.TUTOR, ROLES.FINANCE] }],
  },
  {
    group: "CRM",
    items: [{ label: "Leads", href: "/leads", icon: UserPlus, roles: [ROLES.SUPER_ADMIN, ROLES.COUNSELLOR] }],
  },
  {
    group: "Academics",
    items: [
      { label: "Students", href: "/students", icon: GraduationCap, roles: [ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.TUTOR, ROLES.FINANCE] },
      { label: "Courses", href: "/courses", icon: BookOpen, roles: [ROLES.SUPER_ADMIN] },
      { label: "Curriculum", href: "/curriculum", icon: Layers, roles: [ROLES.SUPER_ADMIN, ROLES.TUTOR] },
      { label: "Attendance", href: "/attendance", icon: CalendarCheck, roles: [ROLES.SUPER_ADMIN, ROLES.TUTOR] },
      { label: "Projects & Portfolio", href: "/portfolio", icon: FolderKanban, roles: [ROLES.SUPER_ADMIN, ROLES.TUTOR] },
    ],
  },
  {
    group: "Finance",
    items: [
      { label: "Finance", href: "/finance", icon: Wallet, roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE] },
      { label: "Reports", href: "/reports", icon: FileBarChart, roles: [ROLES.SUPER_ADMIN, ROLES.FINANCE] },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Masters", href: "/masters", icon: Settings2, roles: [ROLES.SUPER_ADMIN] },
      { label: "Users & Roles", href: "/users", icon: UserCog, roles: [ROLES.SUPER_ADMIN] },
      { label: "Notifications", href: "/notifications", icon: BellRing, roles: [ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.TUTOR, ROLES.FINANCE, ROLES.STUDENT] },
      { label: "Audit Trail", href: "/audit", icon: ShieldCheck, roles: [ROLES.SUPER_ADMIN] },
    ],
  },
];

export function Sidebar({ role, name, studentId }: { role: string; name: string; studentId?: string }) {
  const pathname = usePathname();

  const isStudent = role === ROLES.STUDENT;

  const nav = isStudent
    ? [
        {
          group: "My Account",
          items: [
            {
              label: "My Profile",
              href: `/students/${studentId}`,
              icon: IdCard,
              roles: [ROLES.STUDENT],
            },
          ],
        },
      ]
    : NAV.map((g) => ({
        ...g,
        items: g.items.filter((i) => i.roles.includes(role as Role)),
      })).filter((g) => g.items.length > 0);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
        <img src="/zoop-logo.png" alt="Zoop" className="h-9 w-auto object-contain" />
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">Zoop ERP</p>
          <p className="text-[10px] text-slate-400 leading-tight">Academy Management</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((group) => (
          <div key={group.group}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-100 px-5 py-3">
        <p className="truncate text-[11px] text-slate-400">Signed in as {name}</p>
      </div>
    </aside>
  );
}
