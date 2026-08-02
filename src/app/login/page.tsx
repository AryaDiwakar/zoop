"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white">
              Z
            </div>
            <h1 className="text-xl font-bold text-slate-900">Zoop Multimedia Academy</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to the Academy ERP</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@zoopmultimedia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">Demo accounts</p>
            <p>admin@zoop.academy · counsellor@zoop.academy · tutor@zoop.academy · finance@zoop.academy</p>
            <p className="mt-1">Password for all: <span className="font-mono font-semibold">zoop1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
