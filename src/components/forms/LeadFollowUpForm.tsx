"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Field } from "@/components/ui";
import { CONTACT_METHODS, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";

export function LeadFollowUpForm({ leadId, onDone }: { leadId: string; onDone?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch(`/api/leads/${leadId}/followups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add follow-up");
        setLoading(false);
        return;
      }
      form.get("followUpDate") ? null : null;
      e.currentTarget.reset();
      router.refresh();
      onDone?.();
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Follow-up Date" name="followUpDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <Select label="Contact Method" name="contactMethod" defaultValue="">
          <option value="">—</option>
          {CONTACT_METHODS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="sm:col-span-2">
          <Textarea label="Discussion Notes" name="discussionNotes" rows={2} placeholder="What was discussed?" />
        </div>
        <Textarea label="Counsellor Remarks" name="counsellorRemarks" rows={2} />
        <Input label="Next Follow-up Date" name="nextFollowUpDate" type="date" />
      </div>
      <Select label="Update Status" name="status" defaultValue="">
        <option value="">Keep current status</option>
        {LEAD_STATUSES.filter((s) => s !== "CONVERTED").map((s) => (
          <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
        ))}
      </Select>
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Follow-up"}</Button>
    </form>
  );
}
