import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name, code } = body;
  if (!name || !code) return NextResponse.json({ error: "Name and code are required" }, { status: 400 });

  const exists = await prisma.course.findUnique({ where: { code: String(code).trim() } });
  if (exists) return NextResponse.json({ error: "Course code already exists" }, { status: 409 });

  const course = await prisma.course.create({
    data: {
      name,
      code: String(code).trim().toUpperCase(),
      description: body.description || null,
      durationMonths: Number(body.durationMonths || 6),
      totalClasses: Number(body.totalClasses || 0),
      totalModules: Number(body.totalModules || 0),
      totalProjects: Number(body.totalProjects || 0),
      level: body.level || null,
      learningPattern: body.learningPattern || null,
      softwareUsed: Array.isArray(body.softwareUsed) ? body.softwareUsed : [],
      aiTools: Array.isArray(body.aiTools) ? body.aiTools : [],
      expectedOutcomes: body.expectedOutcomes || null,
      careerOpportunities: body.careerOpportunities || null,
      status: body.status || "ACTIVE",
    },
  });

  await logAudit({
    userId: user.id,
    action: "COURSE_CREATE",
    entity: "Course",
    entityId: course.id,
    details: `Created course — ${course.name} (${course.code})`,
  });

  return NextResponse.json({ course });
}
