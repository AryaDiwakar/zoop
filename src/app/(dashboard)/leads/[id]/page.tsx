import { prisma } from "@/lib/db";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { PageHeader, Card, Button, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadFollowUpForm } from "@/components/forms/LeadFollowUpForm";
import { ConvertLeadForm } from "@/components/forms/ConvertLeadForm";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/utils";
import { LEAD_SOURCE_LABELS } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import Link from "next/link";
import { Phone, Mail, MapPin, GraduationCap, ArrowLeft } from "lucide-react";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";

export const metadata = { title: "Lead Details" };

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole(ROLES.SUPER_ADMIN, ROLES.COUNSELLOR);

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      counsellor: { select: { name: true } },
      followUps: { include: { user: { select: { name: true } } }, orderBy: { followUpDate: "desc" } },
      convertedStudent: {
        include: { course: { select: { name: true } } },
      },
    },
  });
  if (!lead) notFound();

  const [courses, tutors, batches] = await Promise.all([
    prisma.course.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, durationMonths: true } }),
    prisma.user.findMany({ where: { role: "TUTOR", active: true }, select: { id: true, name: true } }),
    prisma.batch.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true } }),
  ]);

  const canConvert = !lead.convertedStudent;

  const infoRows: [string, string][] = [
    ["Lead ID", lead.id.slice(-6).toUpperCase()],
    ["Lead Date", formatDate(lead.leadDate)],
    ["Parent Name", lead.parentName || "—"],
    ["Alt Number", lead.altMobile || "—"],
    ["Email", lead.email || "—"],
    ["Qualification", lead.qualification || "—"],
    ["College / School", lead.college || "—"],
    ["Interested Course", lead.interestedCourse || "—"],
    ["Source", LEAD_SOURCE_LABELS[lead.leadSource] || lead.leadSource],
    ["Counsellor", lead.counsellor?.name || "Unassigned"],
    ["Remarks", lead.remarks || "—"],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Link href="/leads" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
        </Link>
        <PageHeader
          title={lead.studentName}
          subtitle={`Lead ${lead.id.slice(-6).toUpperCase()} · ${LEAD_SOURCE_LABELS[lead.leadSource] || lead.leadSource}`}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={lead.status} />
              {!lead.convertedStudent && user.role === "SUPER_ADMIN" && (
                <DeleteLeadButton leadId={lead.id} />
              )}
            </div>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Contact & Details">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Mobile</p>
                  <p className="text-sm font-medium text-slate-800">{lead.mobile}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-sm font-medium text-slate-800">{lead.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="text-sm font-medium text-slate-800">{lead.address || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <GraduationCap className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Qualification</p>
                  <p className="text-sm font-medium text-slate-800">{lead.qualification || "—"}</p>
                </div>
              </div>
            </div>
          </Card>

          {lead.convertedStudent ? (
            <Card
              title="Admission"
              action={<Badge tone="green">Converted</Badge>}
              className="border-emerald-200 bg-emerald-50/40"
            >
              <p className="text-sm text-slate-600">
                This lead was converted to student{" "}
                <Link href={`/students/${lead.convertedStudent.id}`} className="font-semibold text-brand-600 hover:underline">
                  {lead.convertedStudent.rollNumber} — {lead.convertedStudent.name}
                </Link>{" "}
                ({lead.convertedStudent.course.name})
              </p>
            </Card>
          ) : (
            <Card
              title="Convert to Student"
              subtitle="All lead information transfers automatically — no re-entry needed."
            >
              <ConvertLeadForm
                leadId={lead.id}
                courses={courses}
                tutors={tutors}
                batches={batches}
                defaultValues={{
                  parentName: lead.parentName || undefined,
                  altMobile: lead.altMobile || undefined,
                  email: lead.email || undefined,
                  address: lead.address || undefined,
                  qualification: lead.qualification || undefined,
                }}
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Lead Info">
            <dl className="space-y-2.5">
              {infoRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 text-sm">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="text-right text-xs font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card
            title="Follow-up History"
            subtitle={`${lead.followUps.length} entries`}
            action={
              <Link href={`/leads/${lead.id}/edit`} className="text-xs font-medium text-brand-600 hover:underline">
                Edit lead
              </Link>
            }
          >
            <ol className="relative space-y-4 border-l border-slate-200 pl-4">
              {lead.followUps.length === 0 && <p className="text-sm text-slate-400">No follow-ups yet.</p>}
              {lead.followUps.map((fu) => (
                <li key={fu.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
                  <p className="text-xs font-medium text-slate-700">{formatDateTime(fu.followUpDate)}</p>
                  <p className="mt-1 text-sm text-slate-600">{fu.discussionNotes || "No notes"}</p>
                  {fu.counsellorRemarks && <p className="mt-1 text-xs italic text-slate-400">{fu.counsellorRemarks}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {fu.contactMethod || "—"} · {fu.user?.name || "—"}
                    {fu.nextFollowUpDate && <> · Next: <span className="font-medium text-slate-500">{formatDate(fu.nextFollowUpDate)}</span></>}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Add Follow-up">
            <LeadFollowUpForm leadId={lead.id} />
          </Card>
        </div>
      </div>
    </div>
  );
}
