"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Field } from "@/components/ui";

export function BatchForm({
  courses,
  tutors,
  batch,
}: {
  courses: { id: string; name: string }[];
  tutors: { id: string; name: string }[];
  batch?: {
    id: string;
    name: string;
    courseId: string;
    tutorId?: string | null;
    startDate?: Date | null;
    timings?: string | null;
    status: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;

    const body = {
      name: payload.name,
      courseId: payload.courseId,
      tutorId: payload.tutorId || null,
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      timings: payload.timings || null,
      status: payload.status || "ACTIVE",
    };

    try {
      const res = await fetch(batch ? `/api/batches/${batch.id}` : "/api/batches", {
        method: batch ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save batch");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Batch Name">
          <Input name="name" required defaultValue={batch?.name} placeholder="e.g. FSD Morning Batch" />
        </Field>
        <Field label="Course">
          <Select name="courseId" required defaultValue={batch?.courseId || ""}>
            <option value="" disabled>Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tutor">
          <Select name="tutorId" defaultValue={batch?.tutorId || ""}>
            <option value="">Unassigned</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Start Date">
          <Input name="startDate" type="date" defaultValue={batch?.startDate ? batch.startDate.toISOString().slice(0, 10) : ""} />
        </Field>
        <Field label="Timings">
          <Input name="timings" defaultValue={batch?.timings || ""} placeholder="e.g. Mon–Fri 6–8 PM" />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={batch?.status || "ACTIVE"}>
            <option value="ACTIVE">Active</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "Saving…" : batch ? "Update Batch" : "Create Batch"}</Button>
      </div>
    </form>
  );
}
