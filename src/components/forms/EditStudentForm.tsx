"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Field } from "@/components/ui";
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, DAYS_OF_WEEK, STUDENT_STATUSES, STUDENT_STATUS_LABELS } from "@/lib/constants";

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
interface Availability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function EditStudentForm({
  studentId,
  student,
  courses,
  tutors,
  batches,
}: {
  studentId: string;
  student: {
    name: string;
    parentName: string | null;
    mobile: string;
    altMobile: string | null;
    email: string | null;
    address: string | null;
    qualification: string | null;
    occupation: string | null;
    dob: Date | null;
    emergencyContact: string | null;
    notes: string | null;
    joiningDate: Date;
    status: string;
    courseId: string;
    batchId: string | null;
    tutorId: string | null;
    courseStartDate: Date;
    expectedCompletionDate: Date | null;
    courseDurationMonths: number;
    courseFee: number;
    registrationFee: number;
    discount: number;
    paymentType: string | null;
    paymentTerms: string | null;
    availabilities: Availability[];
  };
  courses: Course[];
  tutors: Tutor[];
  batches: Batch[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseId, setCourseId] = useState(student.courseId);
  const [duration, setDuration] = useState(student.courseDurationMonths);

  const startTimes = student.availabilities.reduce<Record<number, string>>((acc, a) => {
    acc[a.dayOfWeek] = a.startTime;
    return acc;
  }, {});
  const endTimes = student.availabilities.reduce<Record<number, string>>((acc, a) => {
    acc[a.dayOfWeek] = a.endTime;
    return acc;
  }, {});

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
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        setLoading(false);
        return;
      }
      router.push(`/students/${studentId}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Personal Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student Name *">
            <Input name="name" required defaultValue={student.name} />
          </Field>
          <Input label="Parent Name" name="parentName" defaultValue={student.parentName || ""} />
          <Input label="Mobile *" name="mobile" required defaultValue={student.mobile} />
          <Input label="Alternate Number" name="altMobile" defaultValue={student.altMobile || ""} />
          <Input label="Email" name="email" type="email" defaultValue={student.email || ""} />
          <Input label="Address" name="address" defaultValue={student.address || ""} />
          <Input label="Qualification" name="qualification" defaultValue={student.qualification || ""} />
          <Input label="Occupation" name="occupation" defaultValue={student.occupation || ""} />
          <Input label="Date of Birth" name="dob" type="date" defaultValue={toDateInput(student.dob)} />
          <Input label="Emergency Contact" name="emergencyContact" defaultValue={student.emergencyContact || ""} />
          <Input label="Joining Date" name="joiningDate" type="date" defaultValue={toDateInput(student.joiningDate)} />
          <Select label="Status" name="status" defaultValue={student.status}>
            {STUDENT_STATUSES.map((s) => (
              <option key={s} value={s}>{STUDENT_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Admission Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Course *" name="courseId" required value={courseId} onChange={onCourseChange}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Batch" name="batchId" defaultValue={student.batchId || ""}>
            <option value="">—</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Select label="Tutor" name="tutorId" defaultValue={student.tutorId || ""}>
            <option value="">—</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Input label="Course Duration (months)" name="courseDurationMonths" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          <Input label="Course Start Date" name="courseStartDate" type="date" required defaultValue={toDateInput(student.courseStartDate)} />
          <Input label="Expected Completion Date" name="expectedCompletionDate" type="date" defaultValue={toDateInput(student.expectedCompletionDate)} />
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          If the student commences late or the batch timing changes, update the start date / batch / availability below.
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Fee & Payment</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Course Fee" name="courseFee" type="number" min={0} defaultValue={student.courseFee} />
          <Input label="Registration Fee" name="registrationFee" type="number" min={0} defaultValue={student.registrationFee} />
          <Input label="Discount" name="discount" type="number" min={0} defaultValue={student.discount} />
          <Select label="Payment Type" name="paymentType" defaultValue={student.paymentType || "LUMPSUM"}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Input label="Payment Terms" name="paymentTerms" defaultValue={student.paymentTerms || ""} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Weekly Availability / Class Timings</h3>
        <p className="mb-3 text-xs text-slate-500">Classes are auto-scheduled on these days. Missed classes shift to the next available slot.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DAYS_OF_WEEK.map((day, i) => {
            const has = student.availabilities.some((a) => a.dayOfWeek === i);
            return (
              <div key={day} className="rounded-lg border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" name={`day_${i}`} defaultChecked={has} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  {day}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input name={`start_${i}`} type="time" defaultValue={startTimes[i] || (i === 0 ? "10:00" : "18:00")} aria-label={`${day} start`} />
                  <Input name={`end_${i}`} type="time" defaultValue={endTimes[i] || (i === 0 ? "12:00" : "20:00")} aria-label={`${day} end`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Notes</h3>
        <Textarea name="notes" rows={2} defaultValue={student.notes || ""} placeholder="Any notes…" />
      </div>

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save Changes"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
