import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { LeadForm } from "@/components/forms/LeadForm";
import { ROLES } from "@/lib/constants";

export const metadata = { title: "New Lead" };

export default async function NewLeadPage() {
  await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR);
  const counsellors = await prisma.user.findMany({
    where: { role: "COUNSELLOR", active: true },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <PageHeader title="New Lead" subtitle="Capture a new enquiry" />
      <Card>
        <LeadForm counsellors={counsellors} />
      </Card>
    </div>
  );
}
