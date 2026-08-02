"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Field } from "@/components/ui";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, DAYS_OF_WEEK } from "@/lib/constants";

interface Course {
  id: string;
  name: string;
  durationMonths: number;
}
interface Tutor {
  id: string;
  name: string;
}
interface Batch {
  id: string;
  name: string;
}

export function ConvertLeadForm({
  leadId,
  courses,
  tutors,
  batches,
  defaultValues,
}: {
  leadId: string;
  courses: Course[];
  tutors: Tutor[];
  batches: Batch[];
  defaultValues?: {
    parentName?: string;
    altMobile?: string;
    email?: string;
    address?: string;
    qualification?: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(6);
  const [paymentType, setPaymentType] = useState("EMI");

  function onCourseChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setCourseId(id);
    const c = courses.find((x) => x.id === id);
    setDuration(c?.durationMonths || 6);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const days = DAYS_OF_WEEK.map((_, i) => i).filter((i) => (form.get(`day_${i}`) as string) === "on");
    const availability = days.map((d) => ({
      day: d,
      start: (form.get(`start_${d}`) as string) || "10:00",
      end: (form.get(`end_${d}`) as string) || "12:00",
    }));
    const payload: Record<string, unknown> = Object.fromEntries(form.entries());
    payload.availability = availability;
    payload.dob = payload.dob || null;
    delete payload.durationMonths;

    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Conversion failed");
        setLoading(false);
        return;
      }
      router.push(`/students/${data.student.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Admission Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Course *" name="courseId" required value={courseId} onChange={onCourseChange}>
            <option value="">Select course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Batch" name="batchId" defaultValue="">
            <option value="">—</option>
            {batches.filter((b) => !courseId || true).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Select label="Tutor" name="tutorId" defaultValue="">
            <option value="">—</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Input label="Course Duration (months)" name="courseDurationMonths" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          <Input label="Joining Date" name="joiningDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <Input label="Course Start Date" name="courseStartDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <Input label="Expected Completion Date" name="expectedCompletionDate" type="date" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Personal Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Parent Name" name="parentName" defaultValue={defaultValues?.parentName || ""} />
          <Input label="Alternate Number" name="altMobile" defaultValue={defaultValues?.altMobile || ""} />
          <Input label="Email" name="email" defaultValue={defaultValues?.email || ""} />
          <Input label="Address" name="address" defaultValue={defaultValues?.address || ""} />
          <Input label="Qualification" name="qualification" defaultValue={defaultValues?.qualification || ""} />
          <Input label="Occupation" name="occupation" />
          <Input label="Date of Birth" name="dob" type="date" />
          <Input label="Emergency Contact" name="emergencyContact" />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Fee & Payment</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Course Fee" name="courseFee" type="number" min={0} placeholder="50000" />
          <Input label="Registration Fee" name="registrationFee" type="number" min={0} placeholder="2000" />
          <Input label="Discount" name="discount" type="number" min={0} placeholder="0" />
          <Select label="Payment Type" name="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Input label="Payment Terms" name="paymentTerms" defaultValue={paymentType === "EMI" ? "6 monthly installments" : "Full payment at admission"} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Weekly Availability</h3>
        <p className="mb-3 text-xs text-slate-500">Classes are auto-scheduled on these days. Missed classes shift to the next available slot.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={day} className="rounded-lg border border-slate-200 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" name={`day_${i}`} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                {day}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input name={`start_${i}`} type="time" defaultValue={i === 0 ? "10:00" : "18:00"} aria-label={`${day} start`} />
                <Input name={`end_${i}`} type="time" defaultValue={i === 0 ? "12:00" : "20:00"} aria-label={`${day} end`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Notes</h3>
        <Textarea name="notes" rows={2} placeholder="Any admission notes…" />
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={loading}>{loading ? "Converting…" : "Convert to Student"}</Button>
      </div>
    </form>
  );
}
