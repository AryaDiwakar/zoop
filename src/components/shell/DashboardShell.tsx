"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { cn } from "@/components/ui";

export function DashboardShell({
  name,
  email,
  role,
  notificationCount,
  children,
}: {
  name: string;
  email: string;
  role: string;
  notificationCount: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 lg:hidden",
          menuOpen ? "block" : "hidden"
        )}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:translate-x-0 transition-transform",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar role={role} name={name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={name}
          email={email}
          role={role}
          notificationCount={notificationCount}
          onMenu={() => setMenuOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
