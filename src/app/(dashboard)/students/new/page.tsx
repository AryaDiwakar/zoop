import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { StudentForm } from "@/components/forms/StudentForm";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "New Student" };

export default async function NewStudentPage() {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR);
  const [courses, tutors, batches] = await Promise.all([
    prisma.course.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, durationMonths: true } }),
    prisma.user.findMany({ where: { role: "TUTOR", active: true }, select: { id: true, name: true } }),
    prisma.batch.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <PageHeader title="Direct Student Admission" subtitle="Admit an existing student without a lead" />
      <Card>
        <StudentForm courses={courses} tutors={tutors} batches={batches} />
      </Card>
    </div>
  );
}
