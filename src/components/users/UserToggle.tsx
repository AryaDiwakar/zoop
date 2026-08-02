"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui";

export function UserToggle({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) alert((await res.json()).error || "Failed to update");
    } catch {
      alert("Failed to update");
    }
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={cn(
        "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
        active ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      )}
    >
      {pending ? "…" : active ? "Deactivate" : "Activate"}
    </button>
  );
}
