"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/constants";

const STATUSES = ["PRESENT", "ABSENT", "RESCHEDULED", "CANCELLED"];

export function MarkAttendanceButton({
  studentId,
  studentClassId,
  current,
}: {
  studentId: string;
  studentClassId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function mark(status: string) {
    if (status === current || pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/students/${studentId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, id: studentClassId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update");
      }
    } catch {
      alert("Failed to update");
    }
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          onClick={() => mark(s)}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50",
            current === s
              ? s === "PRESENT"
                ? "bg-emerald-600 text-white"
                : s === "ABSENT"
                  ? "bg-rose-600 text-white"
                  : s === "RESCHEDULED"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-400 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
          title={`Mark ${ATTENDANCE_STATUS_LABELS[s]} — absent auto-reschedules to next available slot`}
        >
          {ATTENDANCE_STATUS_LABELS[s][0]}
        </button>
      ))}
    </div>
  );
}
