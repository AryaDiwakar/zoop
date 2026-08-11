"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { formatINR } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

interface Row {
  dueDate: string;
  amount: number;
}

export function EmiScheduleBuilder({ netFee }: { netFee: number }) {
  const [rows, setRows] = useState<Row[]>([{ dueDate: "", amount: 0 }]);

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const diff = netFee - total;
  const balanced = Math.abs(diff) < 0.01;

  function update(i: number, field: keyof Row, value: string) {
    setRows((prev) => {
      const next = prev.map((r, idx) =>
        idx === i ? { ...r, [field]: field === "amount" ? Number(value) || 0 : value } : r
      );
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, { dueDate: "", amount: 0 }]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">EMI Schedule</p>
          <p className="text-xs text-slate-500">
            Enter the expected payment date and amount for each installment.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">
            Planned <span className="font-semibold text-slate-800">{formatINR(total)}</span>
            {" / "}
            Total <span className="font-semibold text-slate-800">{formatINR(netFee)}</span>
          </p>
          <p className={`text-[11px] font-medium ${balanced ? "text-emerald-600" : "text-amber-600"}`}>
            {balanced ? "Balanced — sum equals total fee" : `Remaining to allocate: ${formatINR(diff)}`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                type="date"
                value={r.dueDate}
                required
                onChange={(e) => update(i, "dueDate", e.target.value)}
                placeholder="Due date"
                aria-label={`Installment ${i + 1} due date`}
              />
              <Input
                type="number"
                min={0}
                step="any"
                value={r.amount || ""}
                required
                onChange={(e) => update(i, "amount", e.target.value)}
                placeholder="Amount (₹)"
                aria-label={`Installment ${i + 1} amount`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-rose-600"
              aria-label="Remove installment"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button size="sm" type="button" variant="outline" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" /> Add Installment
        </Button>
        {!balanced && (
          <p className="text-[11px] text-amber-700">Total must match the course fee to save.</p>
        )}
      </div>

      {rows.map((r, i) => (
        <input key={`h${i}`} type="hidden" name="emiDueDate" value={r.dueDate} />
      ))}
      {rows.map((r, i) => (
        <input key={`a${i}`} type="hidden" name="emiAmount" value={r.amount} />
      ))}
    </div>
  );
}
