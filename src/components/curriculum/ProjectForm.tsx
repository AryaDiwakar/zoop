"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Field } from "@/components/ui";
import { DIFFICULTY, DIFFICULTY_LABELS } from "@/lib/constants";
import { Pencil, Plus } from "lucide-react";

export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  deliverables: string | null;
  difficulty: string | null;
  estimatedHours: number;
  evaluationCriteria: string | null;
}

export function ProjectForm({
  courseId,
  moduleId,
  initial,
}: {
  courseId: string;
  moduleId?: string;
  initial?: ProjectData;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      name: (form.get("name") as string) || "",
      description: ((form.get("description") as string) || null) as string | null,
      deliverables: ((form.get("deliverables") as string) || null) as string | null,
      difficulty: ((form.get("difficulty") as string) || null) as string | null,
      estimatedHours: Number(form.get("estimatedHours") || 0),
      evaluationCriteria: ((form.get("evaluationCriteria") as string) || null) as string | null,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/curriculum/projects/${initial.id}` : "/api/curriculum/projects",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, courseId, moduleId: moduleId || null }),
        }
      );
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
    return (
      <Button size="sm" variant={isEdit ? "ghost" : "ghost"} onClick={() => setOpen(true)}>
        {isEdit ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {isEdit ? "Edit" : "Project"}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Field label="Project Name">
        <Input name="name" required placeholder="e.g. Todo App with React" defaultValue={initial?.name ?? ""} />
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={initial?.description || ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Difficulty">
          <Select name="difficulty" defaultValue={initial?.difficulty || ""}>
            <option value="">—</option>
            {DIFFICULTY.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated Hours">
          <Input name="estimatedHours" type="number" min={0} defaultValue={initial?.estimatedHours ?? 0} />
        </Field>
      </div>
      <Field label="Deliverables">
        <Textarea name="deliverables" rows={2} defaultValue={initial?.deliverables || ""} />
      </Field>
      <Field label="Evaluation Criteria">
        <Textarea name="evaluationCriteria" rows={2} defaultValue={initial?.evaluationCriteria || ""} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Project" : "Add Project"}</Button>
      </div>
    </form>
  );
}
