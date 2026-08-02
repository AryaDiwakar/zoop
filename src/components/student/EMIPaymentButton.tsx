"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { formatINR } from "@/lib/utils";

export function EMIPaymentButton({
  emiId,
  dueDate,
  amount,
  amountPaid,
  status,
}: {
  emiId: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(Math.round(amount - amountPaid));

  async function onPay() {
    setError(null);
    setPaying(true);
    try {
      const res = await fetch(`/api/emis/${emiId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaid: payAmount }),
      });
      if (!res.ok) {
        setError((await res.json()).error || "Payment failed");
        setPaying(false);
        return;
      }
      setOpen(false);
      setPaying(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setPaying(false);
    }
  }

  if (status === "PAID") {
    return <span className="text-xs font-semibold text-emerald-600">Paid ✓</span>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-700"
      >
        {open ? "Cancel" : "Record Payment"}
      </button>
      {open && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-2">
          <p className="text-[11px] text-slate-500">
            Due {dueDate} · {formatINR(amount)} · Paid {formatINR(amountPaid)} · Balance {formatINR(Math.max(0, amount - amountPaid))}
          </p>
          <Input
            type="number"
            min={1}
            max={amount}
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            placeholder="Amount"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" type="button" onClick={onPay} disabled={paying}>
              {paying ? "Processing…" : "Collect"}
            </Button>
          </div>
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
