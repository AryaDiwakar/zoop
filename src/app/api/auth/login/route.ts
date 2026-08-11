import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (!user.active) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as never,
      studentId: user.studentId,
    });
    await logAudit({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Login error", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
