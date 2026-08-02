"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Field } from "@/components/ui";
import { DIFFICULTY, DIFFICULTY_LABELS } from "@/lib/constants";

export function ProjectForm({ courseId, moduleId }: { courseId: string; moduleId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;

    try {
      const res = await fetch("/api/curriculum/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          moduleId: moduleId || null,
          name: payload.name,
          description: payload.description || null,
          deliverables: payload.deliverables || null,
          difficulty: payload.difficulty || null,
          estimatedHours: Number(payload.estimatedHours || 0),
          evaluationCriteria: payload.evaluationCriteria || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save project");
        setLoading(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  if (!open) {
    return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>+ Project</Button>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Field label="Project Name">
        <Input name="name" required placeholder="e.g. Todo App with React" />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Difficulty">
          <Select name="difficulty" defaultValue="">
            <option value="">—</option>
            {DIFFICULTY.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated Hours">
          <Input name="estimatedHours" type="number" min={0} defaultValue={0} />
        </Field>
      </div>
      <Field label="Deliverables">
        <Textarea name="deliverables" rows={2} />
      </Field>
      <Field label="Evaluation Criteria">
        <Textarea name="evaluationCriteria" rows={2} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : "Add Project"}</Button>
      </div>
    </form>
  );
}
