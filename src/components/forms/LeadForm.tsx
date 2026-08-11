"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Field } from "@/components/ui";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, CONTACT_METHODS } from "@/lib/constants";

interface Counsellor {
  id: string;
  name: string;
}

export function LeadForm({
  counsellors,
  lead,
}: {
  counsellors: Counsellor[];
  lead?: {
    id: string;
    studentName: string;
    parentName: string | null;
    mobile: string;
    altMobile: string | null;
    email: string | null;
    address: string | null;
    qualification: string | null;
    college: string | null;
    interestedCourse: string | null;
    leadSource: string;
    counsellorId: string | null;
    remarks: string | null;
    status: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [followUpVisible, setFollowUpVisible] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, string>;
    const isEdit = !!lead;

    const body: Record<string, unknown> = {
      ...payload,
      altMobile: payload.altMobile || null,
      email: payload.email || null,
      address: payload.address || null,
      qualification: payload.qualification || null,
      college: payload.college || null,
      interestedCourse: payload.interestedCourse || null,
      remarks: payload.remarks || null,
      counsellorId: payload.counsellorId || null,
      followUp: followUpVisible
        ? {
            discussionNotes: payload.discussionNotes || null,
            contactMethod: payload.contactMethod || null,
            nextFollowUpDate: payload.nextFollowUpDate || null,
            counsellorRemarks: payload.followUpRemarks || null,
          }
        : undefined,
    };
    delete body.discussionNotes;
    delete body.contactMethod;
    delete body.nextFollowUpDate;
    delete body.followUpRemarks;

    try {
      const res = await fetch(isEdit ? `/api/leads/${lead.id}` : "/api/leads", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save lead");
        setLoading(false);
        return;
      }
      router.push(`/leads/${data.lead.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Student Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Student Name *" name="studentName" required defaultValue={lead?.studentName} placeholder="Full name" />
          <Input label="Parent Name" name="parentName" defaultValue={lead?.parentName || ""} />
          <Input label="Mobile *" name="mobile" required defaultValue={lead?.mobile} placeholder="+91 …" />
          <Input label="Alternate Number" name="altMobile" defaultValue={lead?.altMobile || ""} />
          <Input label="Email" name="email" type="email" defaultValue={lead?.email || ""} />
          <Input label="Address" name="address" defaultValue={lead?.address || ""} />
          <Input label="Qualification" name="qualification" defaultValue={lead?.qualification || ""} />
          <Input label="College / School" name="college" defaultValue={lead?.college || ""} />
          <Input label="Interested Course" name="interestedCourse" defaultValue={lead?.interestedCourse || ""} placeholder="e.g. UI/UX Design Pro" />
          <Select label="Lead Source *" name="leadSource" required defaultValue={lead?.leadSource || "OTHER"}>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
            ))}
          </Select>
          <Select label="Counsellor" name="counsellorId" defaultValue={lead?.counsellorId || ""}>
            <option value="">Unassigned</option>
            {counsellors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          {lead && (
            <Select label="Status" name="status" defaultValue={lead.status}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
              ))}
            </Select>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Remarks</h3>
        <Textarea name="remarks" rows={3} defaultValue={lead?.remarks || ""} placeholder="Additional notes about this lead…" />
      </div>

      {!lead && (
        <div>
          <button
            type="button"
            onClick={() => setFollowUpVisible((v) => !v)}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {followUpVisible ? "− Remove initial follow-up" : "+ Add initial follow-up"}
          </button>
          {followUpVisible && (
            <div className="mt-3 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <Field label="Discussion Notes">
                <Textarea name="discussionNotes" rows={2} />
              </Field>
              <Field label="Counsellor Remarks">
                <Textarea name="followUpRemarks" rows={2} />
              </Field>
              <Select label="Contact Method" name="contactMethod" defaultValue="">
                <option value="">—</option>
                {CONTACT_METHODS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Input label="Next Follow-up Date" name="nextFollowUpDate" type="date" />
            </div>
          )}
        </div>
      )}

      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : lead ? "Save Changes" : "Create Lead"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
