"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Field } from "@/components/ui";
import { ROLE_LABELS, ROLES } from "@/lib/constants";

export function UserForm({ students = [] }: { students?: { id: string; name: string; rollNumber: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("COUNSELLOR");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          studentId: payload.studentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create user");
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
    return <Button size="sm" onClick={() => setOpen(true)}>+ New User</Button>;
  }

  const isStudentRole = role === ROLES.STUDENT;

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full Name">
          <Input name="name" required placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Role">
          <Select name="role" required defaultValue="COUNSELLOR" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required placeholder="user@zoop.academy" />
        </Field>
        <Field label="Temporary Password">
          <Input name="password" type="text" required minLength={6} placeholder="min 6 characters" />
        </Field>
        {isStudentRole && (
          <div className="sm:col-span-2">
            <Field label="Map to Student" hint="This login will only be able to see the selected student's own data.">
              <Select name="studentId" required>
                <option value="">Select student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} · {s.rollNumber}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="sm" type="submit" disabled={loading}>{loading ? "Creating…" : "Create User"}</Button>
      </div>
    </form>
  );
}
