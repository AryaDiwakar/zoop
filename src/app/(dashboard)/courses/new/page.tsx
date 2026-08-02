import { PageHeader, Card } from "@/components/ui";
import { CourseForm } from "@/components/forms/CourseForm";

export const metadata = { title: "New Course" };

export default function NewCoursePage() {
  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="New Course" subtitle="Create a course to scaffold its curriculum." />
      <Card>
        <CourseForm />
      </Card>
    </div>
  );
}
