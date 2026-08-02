"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Select, Field } from "@/components/ui";
import { COURSE_STATUSES, COURSE_STATUS_LABELS, DIFFICULTY, DIFFICULTY_LABELS } from "@/lib/constants";

export function CourseForm({
  course,
}: {
  course?: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    durationMonths: number;
    totalClasses: number;
    totalModules: number;
    totalProjects: number;
    level?: string | null;
    learningPattern?: string | null;
    softwareUsed: string[];
    aiTools: string[];
    expectedOutcomes?: string | null;
    careerOpportunities?: string | null;
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
      code: payload.code,
      description: payload.description || null,
      durationMonths: Number(payload.durationMonths || 6),
      totalClasses: Number(payload.totalClasses || 0),
      totalModules: Number(payload.totalModules || 0),
      totalProjects: Number(payload.totalProjects || 0),
      level: payload.level || null,
      learningPattern: payload.learningPattern || null,
      expectedOutcomes: payload.expectedOutcomes || null,
      careerOpportunities: payload.careerOpportunities || null,
      status: payload.status,
      softwareUsed: (payload.softwareUsed || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      aiTools: (payload.aiTools || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(course ? `/api/courses/${course.id}` : "/api/courses", {
        method: course ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save course");
        setLoading(false);
        return;
      }
      router.push(`/courses/${data.course.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Course Name *" name="name" required defaultValue={course?.name} placeholder="e.g. Full Stack Development" />
        <Input label="Course Code *" name="code" required defaultValue={course?.code} placeholder="e.g. FSD" />
      </div>

      <Textarea label="Description" name="description" defaultValue={course?.description || ""} rows={3} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Duration (months)" name="durationMonths" type="number" min={1} defaultValue={course?.durationMonths || 6} />
        <Select label="Level" name="level" defaultValue={course?.level || ""}>
          <option value="">—</option>
          {DIFFICULTY.map((d) => (
            <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
          ))}
        </Select>
        <Select label="Status" name="status" defaultValue={course?.status || "ACTIVE"}>
          {COURSE_STATUSES.map((s) => (
            <option key={s} value={s}>{COURSE_STATUS_LABELS[s]}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Total Modules" name="totalModules" type="number" min={0} defaultValue={course?.totalModules || 0} />
        <Input label="Total Classes" name="totalClasses" type="number" min={0} defaultValue={course?.totalClasses || 0} />
        <Input label="Total Projects" name="totalProjects" type="number" min={0} defaultValue={course?.totalProjects || 0} />
      </div>

      <Input label="Learning Pattern" name="learningPattern" defaultValue={course?.learningPattern || ""} placeholder="e.g. Weekly workshops + self-paced labs" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Software Used (comma separated)" name="softwareUsed" defaultValue={course?.softwareUsed.join(", ")} placeholder="React, Node.js, PostgreSQL" />
        <Input label="AI Tools (comma separated)" name="aiTools" defaultValue={course?.aiTools.join(", ")} placeholder="Cursor, ChatGPT, Copilot" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea label="Expected Outcomes" name="expectedOutcomes" defaultValue={course?.expectedOutcomes || ""} rows={3} />
        <Textarea label="Career Opportunities" name="careerOpportunities" defaultValue={course?.careerOpportunities || ""} rows={3} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : course ? "Save Changes" : "Create Course"}</Button>
      </div>
    </form>
  );
}
