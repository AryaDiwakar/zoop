"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

export function ProjectStudentSubmit({
  studentId,
  id,
  current,
  projectLink,
  submittedNote,
}: {
  studentId: string;
  id: string;
  current: string;
  projectLink?: string | null;
  submittedNote?: string | null;
}) {
  const router = useRouter();
  const [link, setLink] = useState(projectLink || "");
  const [note, setNote] = useState(submittedNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = ["YET_TO_START", "IN_PROGRESS", "REWORK_REQUIRED"].includes(current);

  async function submit() {
    setError(null);
    if (!link.trim()) {
      setError("Add the project link before submitting.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          id,
          status: "SUBMITTED",
          projectLink: link.trim(),
          submittedNote: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
        setSaving(false);
        return;
      }
      router.refresh();
      setSaving(false);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <StatusBadge status={current} />
      {canSubmit && (
        <div className="flex flex-col gap-1.5">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Project link (required)"
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Remarks / what you did…"
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none"
          />
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="self-start rounded-md bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Submitting…" : "Submit Project"}
          </button>
        </div>
      )}
      {!canSubmit && submittedNote && (
        <p className="text-[11px] italic text-slate-500">“{submittedNote}”</p>
      )}
    </div>
  );
}
