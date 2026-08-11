"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/constants";

export function ProjectStatusControl({
  studentId,
  id,
  current,
  facultyFeedback,
  projectLink,
}: {
  studentId: string;
  id: string;
  current: string;
  facultyFeedback?: string | null;
  projectLink?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [feedback, setFeedback] = useState(facultyFeedback || "");
  const [link, setLink] = useState(projectLink || "");
  const [saving, setSaving] = useState(false);

  async function save(nextStatus?: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "project", id, status: nextStatus || status, facultyFeedback: feedback || null, projectLink: link || null }),
      });
      if (!res.ok) alert((await res.json()).error || "Failed to save");
    } catch {
      alert("Failed to save");
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            save(e.target.value);
          }}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-brand-500 focus:outline-none"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {status === "APPROVED" && <span className="text-xs font-semibold text-emerald-600">Approved ✓</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Project link"
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
        />
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Faculty feedback…"
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="self-start rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save feedback"}
        </button>
      </div>
    </div>
  );
}
