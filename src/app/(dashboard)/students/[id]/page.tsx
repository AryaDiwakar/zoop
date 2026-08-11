import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Badge, Table, ProgressBar, Avatar, Button } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { MarkAttendanceButton } from "@/components/student/MarkAttendanceButton";
import { ProjectStatusControl } from "@/components/student/ProjectStatusControl";
import { PortfolioForm } from "@/components/student/PortfolioForm";
import { EMIPaymentButton } from "@/components/student/EMIPaymentButton";
import { CertificateControl } from "@/components/student/CertificateControl";
import { formatDate, formatINR } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { ArrowLeft, GraduationCap, CalendarClock } from "lucide-react";

export const metadata = { title: "Student" };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "curriculum", label: "Curriculum" },
  { key: "classes", label: "Classes" },
  { key: "projects", label: "Projects" },
  { key: "portfolio", label: "Portfolio" },
  { key: "finance", label: "Finance" },
  { key: "certificate", label: "Certificate" },
];

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireAuth();
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : "overview";

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      course: { select: { name: true, durationMonths: true } },
      tutor: { select: { name: true } },
      batch: { select: { name: true } },
      lead: { select: { id: true, studentName: true, status: true } },
      studentModules: { include: { module: { include: { course: true, classes: true, projects: true } } }, orderBy: { module: { number: "asc" } } },
      studentClasses: {
        include: { class: { include: { module: true } } },
        orderBy: [{ class: { module: { number: "asc" } } }, { class: { number: "asc" } }],
      },
      studentProjects: { include: { project: { include: { module: true } } }, orderBy: { project: { module: { number: "asc" } } } },
      portfolios: true,
      availabilities: { orderBy: { dayOfWeek: "asc" } },
      emis: { orderBy: { number: "asc" } },
      certificates: true,
    },
  });
  if (!student) notFound();

  if (user.role === "STUDENT" && user.studentId !== student.id) notFound();

  const canEdit = ["SUPER_ADMIN", "COUNSELLOR", "FINANCE"].includes(user.role);
  const isTutor = user.role === "TUTOR";
  const isStudentView = user.role === "STUDENT";

  // Summary computations
  const totalModules = student.studentModules.length;
  const modulesCompleted = student.studentModules.filter((m) => m.status === "COMPLETED").length;
  const totalClasses = student.studentClasses.length;
  const classesPresent = student.studentClasses.filter((c) => c.attendance === "PRESENT").length;
  const classesAbsent = student.studentClasses.filter((c) => c.attendance === "ABSENT").length;
  const classesPending = student.studentClasses.filter((c) => c.attendance === "PENDING").length;
  const attendancePct = totalClasses > 0 ? Math.round((classesPresent / totalClasses) * 100) : 0;
  const projectsApproved = student.studentProjects.filter((p) => p.status === "APPROVED").length;
  const projectsCompleted = student.studentProjects.filter((p) => ["APPROVED", "SUBMITTED", "INTERNAL_FEEDBACK", "REWORK_REQUIRED"].includes(p.status)).length;
  const totalProjects = student.studentProjects.length;
  const portfolio = student.portfolios[0];
  const totalFee = student.netFee;
  const paid = student.emis.reduce((s, e) => s + e.amountPaid, 0);
  const outstanding = Math.max(0, totalFee - paid);
  const nextEmi = student.emis.find((e) => e.status !== "PAID");
  const certificate = student.certificates[0];

  const summaryRows = [
    ["Total Modules", `${modulesCompleted}/${totalModules}`],
    ["Classes Completed", `${classesPresent}/${totalClasses}`],
    ["Classes Pending", `${classesPending}`],
    ["Attendance %", `${attendancePct}%`],
    ["Projects Approved", `${projectsApproved}/${totalProjects}`],
    ["Portfolio Status", portfolio ? portfolio.status.replace(/_/g, " ") : "—"],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        {!isStudentView && (
          <Link href="/students" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to students
          </Link>
        )}
        <PageHeader
          title={student.name}
          subtitle={`${student.rollNumber} · ${student.course.name}`}
          actions={
            <div className="flex items-center gap-2">
              {canEdit && <Button href={`/students/${student.id}/edit`} size="sm">Edit Details</Button>}
              <StatusBadge status={student.status} />
            </div>
          }
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/students/${student.id}?tab=${t.key}`}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Personal Information">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={student.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-400">{student.rollNumber}</p>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Parent", student.parentName || "—"],
                ["Mobile", student.mobile],
                ["Alt Number", student.altMobile || "—"],
                ["Email", student.email || "—"],
                ["Address", student.address || "—"],
                ["Qualification", student.qualification || "—"],
                ["Occupation", student.occupation || "—"],
                ["Joining Date", formatDate(student.joiningDate)],
                ["Date of Birth", student.dob ? formatDate(student.dob) : "—"],
                ["Emergency Contact", student.emergencyContact || "—"],
                ["Lead Source", student.lead ? "Converted from lead" : "Direct entry"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="text-right text-xs font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>
            {student.lead && (
              <Link href={`/leads/${student.lead.id}`} className="mt-3 inline-block text-xs font-medium text-brand-600 hover:underline">
                View source lead →
              </Link>
            )}
          </Card>

          <Card title="Admission Details">
            <dl className="space-y-2.5 text-sm">
              {[
                ["Course", student.course.name],
                ["Batch", student.batch?.name || "—"],
                ["Tutor", student.tutor?.name || "—"],
                ["Course Start", formatDate(student.courseStartDate)],
                ["Expected Completion", formatDate(student.expectedCompletionDate)],
                ["Duration", `${student.courseDurationMonths} months`],
                ["Status", student.status.replace(/_/g, " ")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-xs text-slate-400">{k}</dt>
                  <dd className="text-right text-xs font-medium text-slate-700">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Availability</span>
                <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              {student.availabilities.length === 0 && <p className="text-xs text-slate-400">No availability set</p>}
              <ul className="mt-1 space-y-1">
                {student.availabilities.map((a) => (
                  <li key={a.id} className="flex justify-between text-xs text-slate-600">
                    <span>{DAYS_OF_WEEK[a.dayOfWeek]}</span>
                    <span className="font-medium">{a.startTime} – {a.endTime}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Academic Summary">
              <div className="space-y-3">
                {summaryRows.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
                <ProgressBar value={totalModules > 0 ? (modulesCompleted / totalModules) * 100 : 0} />
              </div>
            </Card>
            <Card title="Financial Summary">
              <div className="space-y-3">
                {[
                  ["Total Fee", formatINR(totalFee)],
                  ["Amount Paid", formatINR(paid)],
                  ["Outstanding", formatINR(outstanding)],
                  ["Next EMI Due", nextEmi ? `${formatDate(nextEmi.dueDate)} · ${formatINR(nextEmi.balance)}` : "None"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Completion Status">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-xs text-slate-500">Course Status</span>
                  <StatusBadge status={student.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-xs text-slate-500">Certificate Status</span>
                  {certificate ? <StatusBadge status={certificate.status} /> : <Badge tone="slate">—</Badge>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "curriculum" && (
        <div className="space-y-4">
          {student.studentModules.map((sm) => (
            <Card
              key={sm.id}
              title={`Module ${sm.module.number} — ${sm.module.name}`}
              subtitle={sm.module.description || undefined}
              action={<StatusBadge status={sm.status} />}
            >
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-xs text-slate-500">Classes: {sm.module.classes.length} · Projects: {sm.module.projects.length}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "classes" && (
        <Card className="p-0" title="Class Tracker" subtitle="Mark attendance — absences auto-reschedule to the next available slot">
          <Table
            headers={["Module", "Class", "Planned", "Actual", "Attendance", "Remarks"]}
          >
            {student.studentClasses.map((sc) => (
              <tr key={sc.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-600">{sc.class.module.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700">
                  <span className="font-medium">C{sc.class.number}</span> · {sc.class.name}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(sc.plannedDate)}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{sc.actualDate ? formatDate(sc.actualDate) : "—"}</td>
                <td className="px-4 py-2.5">
                  {(isTutor || user.role === "SUPER_ADMIN") && sc.attendance !== "CANCELLED" ? (
                    <MarkAttendanceButton studentId={student.id} studentClassId={sc.id} current={sc.attendance} />
                  ) : (
                    <StatusBadge status={sc.attendance} />
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400 max-w-[200px] truncate">{sc.remarks || "—"}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === "projects" && (
        <Card className="p-0" title="Project Tracker" subtitle="Evaluate and approve module projects">
          <Table
            headers={["Module", "Project", "Deliverables", "Difficulty", "Status", "Project Link", "Approved / Submitted"]}
          >
            {student.studentProjects.map((sp) => (
              <tr key={sp.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-xs text-slate-600">{sp.project.module?.name || "Final"}</td>
                <td className="px-4 py-2.5">
                  <p className="text-xs font-medium text-slate-800">{sp.project.name}</p>
                  <p className="text-[11px] text-slate-400">{sp.project.deliverables || ""}</p>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{sp.project.estimatedHours}h</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{sp.project.difficulty || "—"}</td>
                <td className="px-4 py-2.5">
                  {isTutor || user.role === "SUPER_ADMIN" ? (
                    <ProjectStatusControl
                      studentId={student.id}
                      id={sp.id}
                      current={sp.status}
                      facultyFeedback={sp.facultyFeedback}
                      projectLink={sp.projectLink}
                    />
                  ) : (
                    <StatusBadge status={sp.status} />
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {sp.projectLink ? (
                    <a
                      href={sp.projectLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[180px] truncate inline-block font-medium text-brand-600 hover:underline"
                    >
                      {sp.projectLink}
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                  {sp.submissionDate ? <>Sub: {formatDate(sp.submissionDate)}</> : "—"}
                  {sp.approvalDate && <> · App: {formatDate(sp.approvalDate)}</>}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {tab === "portfolio" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Final Portfolio" subtitle="Complete portfolio at course end">
            {portfolio ? (
              isStudentView ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Status</span>
                    <StatusBadge status={portfolio.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Submitted</span>
                    <span className="font-medium text-slate-700">{portfolio.submittedAt ? formatDate(portfolio.submittedAt) : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Reviewed</span>
                    <span className="font-medium text-slate-700">{portfolio.reviewedAt ? formatDate(portfolio.reviewedAt) : "—"}</span>
                  </div>
                  {portfolio.facultyReview && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="mb-1 text-[11px] text-slate-400">Faculty Review</p>
                      <p className="text-xs text-slate-700">{portfolio.facultyReview}</p>
                    </div>
                  )}
                </div>
              ) : (
                <PortfolioForm studentId={student.id} portfolio={portfolio} />
              )
            ) : (
              <p className="text-sm text-slate-400">No portfolio yet.</p>
            )}
          </Card>
          <div className="space-y-6">
            <Card title="Portfolio Links">
              <div className="space-y-2 text-sm">
                {[
                  ["Behance", portfolio?.behanceLink],
                  ["Dribbble", portfolio?.dribbbleLink],
                  ["Website", portfolio?.websiteLink],
                  ["PDF", portfolio?.pdfUrl],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <span className="text-xs text-slate-400">{k}</span>
                    {v ? (
                      <a href={v as string} target="_blank" rel="noopener noreferrer" className="max-w-[60%] truncate text-xs font-medium text-brand-600 hover:underline">
                        {v}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                ))}
                {portfolio?.facultyReview && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 text-[11px] text-slate-400">Faculty Review</p>
                    <p className="text-xs text-slate-700">{portfolio.facultyReview}</p>
                  </div>
                )}
              </div>
            </Card>
            <Card title="Submission Timeline">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Status</span>
                  {portfolio ? <StatusBadge status={portfolio.status} /> : <span>—</span>}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Submitted</span>
                  <span className="font-medium text-slate-700">{portfolio?.submittedAt ? formatDate(portfolio.submittedAt) : "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Reviewed</span>
                  <span className="font-medium text-slate-700">{portfolio?.reviewedAt ? formatDate(portfolio.reviewedAt) : "—"}</span>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {tab === "finance" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card title="Total Fee">
              <p className="text-xl font-bold text-slate-900">{formatINR(totalFee)}</p>
            </Card>
            <Card title="Amount Paid">
              <p className="text-xl font-bold text-emerald-600">{formatINR(paid)}</p>
            </Card>
            <Card title="Outstanding">
              <p className="text-xl font-bold text-amber-600">{formatINR(outstanding)}</p>
            </Card>
            <Card title="Payment Type">
              <p className="text-xl font-bold text-slate-900">{student.paymentType || "—"}</p>
            </Card>
          </div>
          <Card className="p-0" title="EMI Schedule" subtitle="Installments & collections">
            <Table
              headers={["#", "Due Date", "Amount", "Paid", "Balance", "Payment Date", "Receipt", "Mode", "Status", ""]}
            >
              {student.emis.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">EMI {e.number}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">{formatDate(e.dueDate)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{formatINR(e.amount)}</td>
                  <td className="px-4 py-2.5 text-xs text-emerald-700">{formatINR(e.amountPaid)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{formatINR(e.balance)}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{e.paymentDate ? formatDate(e.paymentDate) : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{e.receiptNumber || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{e.paymentMode || "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-2.5">
                    {canEdit && (
                      <EMIPaymentButton
                        emiId={e.id}
                        dueDate={formatDate(e.dueDate)}
                        amount={e.amount}
                        amountPaid={e.amountPaid}
                        status={e.status}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      )}

      {tab === "certificate" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Certificate Management" subtitle="Track eligibility and issuance">
            {certificate ? (
              <CertificateControl studentId={student.id} certificate={certificate} />
            ) : (
              <p className="text-sm text-slate-400">No certificate record.</p>
            )}
          </Card>
          <Card title="Eligibility Overview">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">All modules completed</span>
                <span className={`font-semibold ${modulesCompleted === totalModules && totalModules > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                  {modulesCompleted}/{totalModules}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Portfolio approved</span>
                <span className={`font-semibold ${portfolio?.status === "APPROVED" ? "text-emerald-600" : "text-slate-600"}`}>
                  {portfolio?.status === "APPROVED" ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Fees cleared</span>
                <span className={`font-semibold ${outstanding <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {outstanding <= 0 ? "Yes" : formatINR(outstanding) + " due"}
                </span>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Certificate is auto-numbered (<span className="font-mono">ZOO-CERT-XXXX</span>) when generated, and the student is marked{" "}
                  <span className="font-medium">Certificate Issued</span> upon final issuance.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
