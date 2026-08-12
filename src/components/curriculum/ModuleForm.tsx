"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field } from "@/components/ui";
import { Pencil, Plus } from "lucide-react";

export interface ModuleData {
  id: string;
  number: number;
  name: string;
  description: string | null;
  learningObjectives: string | null;
  totalClasses: number;
}

export function ModuleForm({
  courseId,
  nextNumber,
  initial,
}: {
  courseId: string;
  nextNumber: number;
  initial?: ModuleData;
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
      number: Number(form.get("number")),
      name: (form.get("name") as string) || "",
      description: ((form.get("description") as string) || null) as string | null,
      learningObjectives: ((form.get("learningObjectives") as string) || null) as string | null,
      totalClasses: Number(form.get("totalClasses") || 0),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/curriculum/modules/${initial.id}` : "/api/curriculum/modules",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, courseId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save module");
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
      <Button size="sm" variant={isEdit ? "ghost" : "outline"} onClick={() => setOpen(true)}>
        {isEdit ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {isEdit ? "Edit" : "Module"}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
        <Field label="Number">
          <Input name="number" type="number" min={1} required defaultValue={initial?.number ?? nextNumber} />
        </Field>
        <Field label="Module Name">
          <Input name="name" required placeholder="e.g. JavaScript Fundamentals" defaultValue={initial?.name ?? ""} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={2} defaultValue={initial?.description || ""} />
      </Field>
      <Field label="Learning Objectives">
        <Textarea name="learningObjectives" rows={2} defaultValue={initial?.learningObjectives || ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Total Classes">
          <Input name="totalClasses" type="number" min={0} defaultValue={initial?.totalClasses ?? 0} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Module" : "Add Module"}</Button>
      </div>
    </form>
  );
}
