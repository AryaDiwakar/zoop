"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

export function PortfolioStudentSubmit({
  studentId,
  portfolio,
}: {
  studentId: string;
  portfolio?: {
    status: string;
    behanceLink: string | null;
    dribbbleLink: string | null;
    websiteLink: string | null;
    pdfUrl: string | null;
    facultyReview: string | null;
  } | null;
}) {
  const router = useRouter();
  const [behance, setBehance] = useState(portfolio?.behanceLink || "");
  const [dribbble, setDribbble] = useState(portfolio?.dribbbleLink || "");
  const [website, setWebsite] = useState(portfolio?.websiteLink || "");
  const [pdf, setPdf] = useState(portfolio?.pdfUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = portfolio?.status || "YET_TO_START";
  const canSubmit = ["YET_TO_START", "IN_PROGRESS", "UNDER_REVIEW"].includes(status);
  const hasLink = behance.trim() || dribbble.trim() || website.trim() || pdf.trim();

  async function save(finalize: boolean) {
    setError(null);
    if (finalize && !hasLink) {
      setError("Add at least one portfolio link before submitting.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          behanceLink: behance.trim() || null,
          dribbbleLink: dribbble.trim() || null,
          websiteLink: website.trim() || null,
          pdfUrl: pdf.trim() || null,
          status: finalize ? "SUBMITTED" : "IN_PROGRESS",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save portfolio");
        setSaving(false);
        return;
      }
      router.refresh();
      setSaving(false);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Status</span>
        <StatusBadge status={status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Behance Link" value={behance} onChange={(e) => setBehance(e.target.value)} placeholder="https://behance.net/…" />
        <Input label="Dribbble Link" value={dribbble} onChange={(e) => setDribbble(e.target.value)} placeholder="https://dribbble.com/…" />
        <Input label="Personal Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
        <Input label="PDF Upload URL" value={pdf} onChange={(e) => setPdf(e.target.value)} placeholder="https://…/portfolio.pdf" />
      </div>
      {portfolio?.facultyReview && (
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="mb-1 text-[11px] text-slate-400">Faculty Review</p>
          <p className="text-xs text-slate-700">{portfolio.facultyReview}</p>
        </div>
      )}
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => save(false)} disabled={saving} variant="outline" size="sm">
          {saving ? "Saving…" : "Save Draft"}
        </Button>
        {canSubmit && (
          <Button type="button" onClick={() => save(true)} disabled={saving} size="sm">
            {saving ? "Submitting…" : "Submit for Review"}
          </Button>
        )}
      </div>
    </div>
  );
}
