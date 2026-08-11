import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, email, password, role } = body;
  if (!name || !email || !password || !role)
    return NextResponse.json({ error: "Name, email, password and role are required" }, { status: 400 });
  if (String(password).length < 6)
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const studentId = role === "STUDENT" ? body.studentId || null : null;
  if (role === "STUDENT" && !studentId)
    return NextResponse.json({ error: "Select the student to map this login to" }, { status: 400 });
  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 400 });
    const alreadyMapped = await prisma.user.findFirst({ where: { studentId } });
    if (alreadyMapped)
      return NextResponse.json({ error: "That student already has a login account" }, { status: 409 });
  }

  const normalized = String(email).toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normalized } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const created = await prisma.user.create({
    data: {
      name,
      email: normalized,
      passwordHash: await bcrypt.hash(String(password), 10),
      role,
      active: true,
      studentId,
    },
  });

  await logAudit({ userId: user.id, action: "USER_CREATE", entity: "User", entityId: created.id, details: `Created ${role} — ${name}${studentId ? ` (mapped to student ${studentId})` : ""}` });
  return NextResponse.json({ user: { id: created.id, name: created.name, email: created.email, role: created.role } });
}
