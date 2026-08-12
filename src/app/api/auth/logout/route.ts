import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({ userId: session.userId, action: "LOGOUT", entity: "User" });
  }
  await destroySession();
  // 303 See Other so the redirect performs a GET to /login (307 would replay the POST).
  return NextResponse.redirect(new URL("/login", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"), 303);
}
