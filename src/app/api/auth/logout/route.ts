import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await logAudit({ userId: session.userId, action: "LOGOUT", entity: "User" });
  }
  await destroySession();
  // Build the redirect from the actual incoming request origin — VERCEL_URL points at the
  // unique per-deployment hostname (which can be behind deployment protection), not the
  // stable production domain the user is actually browsing.
  const url = new URL("/login", request.url);
  // 303 See Other so the redirect performs a GET to /login (307 would replay the POST).
  return NextResponse.redirect(url, 303);
}
