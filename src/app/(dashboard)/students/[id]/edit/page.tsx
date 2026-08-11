import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { EditStudentForm } from "@/components/forms/EditStudentForm";
import { ROLES } from "@/lib/constants";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Student" };

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR, ROLES.FINANCE);

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, durationMonths: true } },
      batch: { select: { id: true, name: true } },
      tutor: { select: { id: true, name: true } },
      availabilities: true,
    },
  });
  if (!student) notFound();

  const [courses, tutors, batches] = await Promise.all([
    prisma.course.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, durationMonths: true } }),
    prisma.user.findMany({ where: { role: "TUTOR", active: true }, select: { id: true, name: true } }),
    prisma.batch.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link href={`/students/${student.id}`} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {student.name}
      </Link>
      <PageHeader title={`Edit ${student.name}`} subtitle={`${student.rollNumber} · update admission and timings`} />
      <Card>
        <EditStudentForm
          studentId={student.id}
          student={student}
          courses={courses}
          tutors={tutors}
          batches={batches}
        />
      </Card>
    </div>
  );
}
