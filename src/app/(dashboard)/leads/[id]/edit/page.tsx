import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { LeadForm } from "@/components/forms/LeadForm";
import { notFound } from "next/navigation";
import { ROLES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Edit Lead" };

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR);

  const [lead, counsellors] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.user.findMany({ where: { role: "COUNSELLOR", active: true }, select: { id: true, name: true } }),
  ]);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Link href={`/leads/${lead.id}`} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to lead
      </Link>
      <PageHeader title="Edit Lead" subtitle={lead.studentName} />
      <Card>
        <LeadForm
          counsellors={counsellors}
          lead={{
            id: lead.id,
            studentName: lead.studentName,
            parentName: lead.parentName,
            mobile: lead.mobile,
            altMobile: lead.altMobile,
            email: lead.email,
            address: lead.address,
            qualification: lead.qualification,
            college: lead.college,
            interestedCourse: lead.interestedCourse,
            leadSource: lead.leadSource,
            counsellorId: lead.counsellorId,
            remarks: lead.remarks,
            status: lead.status,
          }}
        />
      </Card>
    </div>
  );
}
