"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field } from "@/components/ui";
import { Pencil, Plus } from "lucide-react";

export interface ClassData {
  id: string;
  number: number;
  name: string;
  learningTopic: string | null;
  practicalExercise: string | null;
  durationMinutes: number;
  tutorNotes: string | null;
}

export function ClassForm({
  moduleId,
  nextNumber,
  initial,
}: {
  moduleId: string;
  nextNumber: number;
  initial?: ClassData;
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
      learningTopic: ((form.get("learningTopic") as string) || null) as string | null,
      practicalExercise: ((form.get("practicalExercise") as string) || null) as string | null,
      tutorNotes: ((form.get("tutorNotes") as string) || null) as string | null,
      durationMinutes: Number(form.get("durationMinutes") || 120),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/curriculum/classes/${initial.id}` : "/api/curriculum/classes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, moduleId }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save class");
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
        {isEdit ? "Edit" : "Class"}
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-[90px_1fr_110px]">
        <Field label="#">
          <Input name="number" type="number" min={1} required defaultValue={initial?.number ?? nextNumber} />
        </Field>
        <Field label="Class Name">
          <Input name="name" required placeholder="e.g. Variables & Data Types" defaultValue={initial?.name ?? ""} />
        </Field>
        <Field label="Minutes">
          <Input name="durationMinutes" type="number" min={15} defaultValue={initial?.durationMinutes ?? 120} />
        </Field>
      </div>
      <Field label="Learning Topic">
        <Textarea name="learningTopic" rows={1} defaultValue={initial?.learningTopic || ""} />
      </Field>
      <Field label="Practical Exercise">
        <Textarea name="practicalExercise" rows={1} defaultValue={initial?.practicalExercise || ""} />
      </Field>
      <Field label="Tutor Notes">
        <Textarea name="tutorNotes" rows={1} defaultValue={initial?.tutorNotes || ""} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Class" : "Add Class"}</Button>
      </div>
    </form>
  );
}
