"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/ui";

export function ProjectStudentCreate({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);
    if (!name.trim()) {
      setError("Add a project name.");
      return;
    }
    if (!link.trim()) {
      setError("Add the project link.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          create: true,
          name: name.trim(),
          projectLink: link.trim(),
          submittedNote: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add project");
        setSaving(false);
        return;
      }
      setName("");
      setLink("");
      setNote("");
      setOpen(false);
      router.refresh();
      setSaving(false);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="mb-4">
      {!open ? (
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          Add Project
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Input label="Project Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Portfolio Website" />
          <Input label="Project Link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Remarks</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What you did…"
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={add} disabled={saving}>
              {saving ? "Adding…" : "Add Project"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
