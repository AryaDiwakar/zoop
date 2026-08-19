import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: parentCourseId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { sourceCourseId } = body;
  if (!sourceCourseId)
    return NextResponse.json({ error: "Source course ID is required" }, { status: 400 });

  if (sourceCourseId === parentCourseId)
    return NextResponse.json({ error: "Cannot import a course into itself" }, { status: 400 });

  const parentCourse = await prisma.course.findUnique({ where: { id: parentCourseId } });
  if (!parentCourse) return NextResponse.json({ error: "Parent course not found" }, { status: 404 });

  const sourceCourse = await prisma.course.findUnique({
    where: { id: sourceCourseId },
    include: {
      modules: {
        orderBy: { number: "asc" },
        include: {
          classes: { orderBy: { number: "asc" } },
          projects: true,
        },
      },
    },
  });
  if (!sourceCourse) return NextResponse.json({ error: "Source course not found" }, { status: 404 });

  const maxModule = await prisma.module.aggregate({
    where: { courseId: parentCourseId },
    _max: { number: true },
  });
  let currentModuleNum = (maxModule._max.number || 0) + 1;

  let totalClassesImported = 0;
  let totalProjectsImported = 0;

  for (const sourceModule of sourceCourse.modules) {
    const newModule = await prisma.module.create({
      data: {
        courseId: parentCourseId,
        number: currentModuleNum++,
        name: sourceModule.name,
        description: sourceModule.description,
        learningObjectives: sourceModule.learningObjectives,
        totalClasses: sourceModule.totalClasses,
      },
    });

    for (const sourceClass of sourceModule.classes) {
      await prisma.class.create({
        data: {
          moduleId: newModule.id,
          number: sourceClass.number,
          name: sourceClass.name,
          learningTopic: sourceClass.learningTopic,
          practicalExercise: sourceClass.practicalExercise,
          durationMinutes: sourceClass.durationMinutes,
          tutorNotes: sourceClass.tutorNotes,
        },
      });
      totalClassesImported++;
    }

    for (const sourceProject of sourceModule.projects) {
      await prisma.project.create({
        data: {
          courseId: parentCourseId,
          moduleId: newModule.id,
          name: sourceProject.name,
          description: sourceProject.description,
          deliverables: sourceProject.deliverables,
          difficulty: sourceProject.difficulty,
          estimatedHours: sourceProject.estimatedHours,
          evaluationCriteria: sourceProject.evaluationCriteria,
          isSelfProject: sourceProject.isSelfProject,
        },
      });
      totalProjectsImported++;
    }
  }

  await prisma.course.update({
    where: { id: parentCourseId },
    data: {
      totalModules: { increment: sourceCourse.modules.length },
      totalClasses: { increment: totalClassesImported },
      totalProjects: { increment: totalProjectsImported },
    },
  });

  await logAudit({
    userId: user.id,
    action: "COURSE_IMPORT",
    entity: "Course",
    entityId: parentCourseId,
    details: `Imported ${sourceCourse.modules.length} modules from "${sourceCourse.name}" into "${parentCourse.name}"`,
  });

  revalidatePath("/curriculum");
  revalidatePath(`/courses/${parentCourseId}`);

  return NextResponse.json({
    ok: true,
    imported: {
      modules: sourceCourse.modules.length,
      classes: totalClassesImported,
      projects: totalProjectsImported,
    },
  });
}
