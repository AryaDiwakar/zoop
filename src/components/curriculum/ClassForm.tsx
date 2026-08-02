"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field } from "@/components/ui";

export function ClassForm({ moduleId, nextNumber }: { moduleId: string; nextNumber: number }) {
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
      const res = await fetch("/api/curriculum/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId,
          number: Number(payload.number),
          name: payload.name,
          learningTopic: payload.learningTopic || null,
          practicalExercise: payload.practicalExercise || null,
          durationMinutes: Number(payload.durationMinutes || 120),
        }),
      });
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
    return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>+ Class</Button>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-[90px_1fr_110px]">
        <Field label="#">
          <Input name="number" type="number" min={1} required defaultValue={nextNumber} />
        </Field>
        <Field label="Class Name">
          <Input name="name" required placeholder="e.g. Variables & Data Types" />
        </Field>
        <Field label="Minutes">
          <Input name="durationMinutes" type="number" min={15} defaultValue={120} />
        </Field>
      </div>
      <Field label="Learning Topic">
        <Textarea name="learningTopic" rows={1} />
      </Field>
      <Field label="Practical Exercise">
        <Textarea name="practicalExercise" rows={1} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : "Add Class"}</Button>
      </div>
    </form>
  );
}
