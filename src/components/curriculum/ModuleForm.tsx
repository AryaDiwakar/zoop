"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field } from "@/components/ui";

export function ModuleForm({ courseId, nextNumber }: { courseId: string; nextNumber: number }) {
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
      const res = await fetch("/api/curriculum/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          number: Number(payload.number),
          name: payload.name,
          description: payload.description || null,
          learningObjectives: payload.learningObjectives || null,
          totalClasses: Number(payload.totalClasses || 0),
        }),
      });
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
    return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>+ Module</Button>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
        <Field label="Number">
          <Input name="number" type="number" min={1} required defaultValue={nextNumber} />
        </Field>
        <Field label="Module Name">
          <Input name="name" required placeholder="e.g. JavaScript Fundamentals" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" rows={2} />
      </Field>
      <Field label="Learning Objectives">
        <Textarea name="learningObjectives" rows={2} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Total Classes">
          <Input name="totalClasses" type="number" min={0} defaultValue={0} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Saving…" : "Add Module"}</Button>
      </div>
    </form>
  );
}
