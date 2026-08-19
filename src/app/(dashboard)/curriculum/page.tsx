import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { ModuleForm } from "@/components/curriculum/ModuleForm";
import { ClassForm } from "@/components/curriculum/ClassForm";
import { ProjectForm } from "@/components/curriculum/ProjectForm";
import { CourseImportModal } from "@/components/curriculum/CourseImportModal";
import { ROLES, DIFFICULTY_LABELS } from "@/lib/constants";

export const metadata = { title: "Curriculum" };

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.TUTOR);
  const sp = await searchParams;

  const courses = await prisma.course.findMany({
    where: sp.course ? { id: sp.course } : undefined,
    include: {
      modules: {
        orderBy: { number: "asc" },
        include: {
          classes: { orderBy: { number: "asc" } },
          projects: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const allCourses = await prisma.course.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      modules: {
        select: {
          _count: { select: { classes: true, projects: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Curriculum Builder" subtitle="Map modules, classes and projects per course." />

      {courses.length === 0 && (
        <Card>
          <EmptyState title="No courses found" subtitle="Create a course first to build its curriculum." />
        </Card>
      )}

      {courses.map((course) => (
        <Card
          key={course.id}
          title={`${course.name} (${course.code})`}
          subtitle={`${course.modules.length} modules`}
          action={
            <div className="flex gap-2">
              <CourseImportModal
                targetCourseId={course.id}
                courses={allCourses}
              />
              <ModuleForm
                courseId={course.id}
                nextNumber={(course.modules.at(-1)?.number || 0) + 1}
              />
            </div>
          }
        >
          {course.modules.length === 0 && (
            <p className="text-sm text-slate-400">No modules yet — add the first module.</p>
          )}
          <div className="space-y-4">
            {course.modules.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      M{m.number} · {m.name}
                    </h4>
                    {m.description && <p className="mt-0.5 text-xs text-slate-500">{m.description}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <ModuleForm courseId={course.id} nextNumber={m.number} initial={m} />
                    <ClassForm moduleId={m.id} nextNumber={(m.classes.at(-1)?.number || 0) + 1} />
                    <ProjectForm courseId={course.id} moduleId={m.id} />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Classes ({m.classes.length})</p>
                    {m.classes.length === 0 && <p className="text-xs text-slate-400">No classes.</p>}
                    <ul className="space-y-1.5">
                      {m.classes.map((c) => (
                        <li key={c.id} className="rounded-md bg-white p-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-700">
                              <span className="font-mono font-semibold text-slate-500">C{c.number}</span> · {c.name}
                            </span>
                            <ClassForm moduleId={m.id} nextNumber={c.number} initial={c} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Projects ({m.projects.length})</p>
                    {m.projects.length === 0 && <p className="text-xs text-slate-400">No projects.</p>}
                    <ul className="space-y-1.5">
                      {m.projects.map((p) => (
                        <li key={p.id} className="rounded-md bg-white p-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-slate-700">
                              {p.name}{" "}
                              {p.difficulty && (
                                <Badge tone={p.difficulty === "ADVANCED" ? "red" : p.difficulty === "INTERMEDIATE" ? "amber" : "blue"}>
                                  {DIFFICULTY_LABELS[p.difficulty]}
                                </Badge>
                              )}
                            </span>
                            <ProjectForm courseId={course.id} moduleId={m.id} initial={p} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
