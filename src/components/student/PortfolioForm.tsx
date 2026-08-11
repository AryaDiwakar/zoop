"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea } from "@/components/ui";
import { PORTFOLIO_STATUSES, PORTFOLIO_STATUS_LABELS } from "@/lib/constants";

export function PortfolioForm({
  studentId,
  portfolio,
}: {
  studentId: string;
  portfolio: {
    status: string;
    behanceLink: string | null;
    dribbbleLink: string | null;
    websiteLink: string | null;
    pdfUrl: string | null;
    facultyReview: string | null;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(portfolio.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.status = status;
    try {
      const res = await fetch(`/api/students/${studentId}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError((await res.json()).error || "Failed to save");
        setSaving(false);
        return;
      }
      setSaving(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Portfolio Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
        >
          {PORTFOLIO_STATUSES.map((s) => (
            <option key={s} value={s}>{PORTFOLIO_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Behance Link" name="behanceLink" defaultValue={portfolio.behanceLink || ""} placeholder="https://behance.net/…" />
        <Input label="Dribbble Link" name="dribbbleLink" defaultValue={portfolio.dribbbleLink || ""} placeholder="https://dribbble.com/…" />
        <Input label="Personal Website" name="websiteLink" defaultValue={portfolio.websiteLink || ""} placeholder="https://…" />
        <Input label="PDF Upload URL" name="pdfUrl" defaultValue={portfolio.pdfUrl || ""} placeholder="https://…/portfolio.pdf" />
      </div>
      <Textarea label="Faculty Review" name="facultyReview" rows={2} defaultValue={portfolio.facultyReview || ""} placeholder="Review notes…" />
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Portfolio"}</Button>
    </form>
  );
}
