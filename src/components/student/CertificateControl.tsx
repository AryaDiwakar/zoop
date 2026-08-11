"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea } from "@/components/ui";
import { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_LABELS } from "@/lib/constants";

export function CertificateControl({
  studentId,
  certificate,
}: {
  studentId: string;
  certificate: {
    status: string;
    certificateNumber: string | null;
    issueDate: Date | null;
    remarks: string | null;
  };
}) {
  const router = useRouter();
  const [status, setStatus] = useState(certificate.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: null }),
      });
      if (!res.ok) {
        setError((await res.json()).error || "Failed to update");
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
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Certificate Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
        >
          {CERTIFICATE_STATUSES.map((s) => (
            <option key={s} value={s}>{CERTIFICATE_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[11px] text-slate-400">Certificate Number</p>
          <p className="text-sm font-semibold text-slate-800">{certificate.certificateNumber || "— (auto-generated on issue)"}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[11px] text-slate-400">Issue Date</p>
          <p className="text-sm font-semibold text-slate-800">{certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString("en-IN") : "—"}</p>
        </div>
      </div>
      {certificate.remarks && <Textarea label="Remarks" defaultValue={certificate.remarks || ""} readOnly rows={2} />}
      {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <Button type="button" onClick={save} disabled={saving}>
        {saving ? "Saving…" : status === "ISSUED" ? "Mark as Issued" : "Update Certificate Status"}
      </Button>
    </div>
  );
}
