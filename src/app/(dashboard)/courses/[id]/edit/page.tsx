import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { CourseForm } from "@/components/forms/CourseForm";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "Edit Course" };

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(ROLES.SUPER_ADMIN);
  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) notFound();

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title={`Edit — ${course.name}`} subtitle="Update course details." />
      <Card>
        <CourseForm course={course} />
      </Card>
    </div>
  );
}
