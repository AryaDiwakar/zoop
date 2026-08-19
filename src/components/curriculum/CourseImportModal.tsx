"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Select } from "@/components/ui";
import { Plus, X } from "lucide-react";

interface CourseOption {
  id: string;
  name: string;
  code: string;
  modules: { _count: { classes: number; projects: number } }[];
}

export function CourseImportModal({
  targetCourseId,
  courses,
}: {
  targetCourseId: string;
  courses: CourseOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const availableCourses = courses.filter((c) => c.id !== targetCourseId);
  const selectedCourse = availableCourses.find((c) => c.id === selectedCourseId);

  async function handleImport() {
    if (!selectedCourseId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${targetCourseId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCourseId: selectedCourseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to import course");
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
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Import Course
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Import Course Modules</h3>
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <Field label="Select Course to Import">
          <Select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">— Choose a course —</option>
            {availableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
        </Field>

        {selectedCourse && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-700">This will import:</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• {selectedCourse.modules.length} modules</li>
              <li>
                • {selectedCourse.modules.reduce((sum, m) => sum + m._count.classes, 0)} classes
              </li>
              <li>
                • {selectedCourse.modules.reduce((sum, m) => sum + m._count.projects, 0)} projects
              </li>
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">
              Modules will be appended after existing modules in sequence.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={loading || !selectedCourseId}
          >
            {loading ? "Importing…" : "Import Course"}
          </Button>
        </div>
      </div>
    </div>
  );
}
