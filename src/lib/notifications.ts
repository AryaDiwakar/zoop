import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils";
import { Role, ROLES } from "@/lib/constants";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  href: string;
  date: string;
}

interface Viewer {
  id: string;
  role: string;
  studentId?: string | null;
}

function studentScope(user?: Viewer | null): { studentId: string } | {} {
  if (user?.role === ROLES.STUDENT && user.studentId) return { studentId: user.studentId };
  return {};
}

export async function getNotifications(user?: Viewer | null): Promise<NotificationItem[]> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();
  const isStudent = user?.role === ROLES.STUDENT;
  const items: NotificationItem[] = [];
  const scope = studentScope(user);

  // 1. Recent activities (payments, portfolio, admissions, certificates)
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [recentPayments, recentPortfolios, recentAdmissions, recentCertificates] =
    await Promise.all([
      prisma.eMI.findMany({
        where: { paymentDate: { gte: since }, ...scope },
        select: {
          id: true,
          number: true,
          amount: true,
          paymentDate: true,
          student: { select: { id: true, name: true } },
        },
        orderBy: { paymentDate: "desc" },
        take: 20,
      }),
      prisma.portfolio.findMany({
        where: {
          OR: [{ submittedAt: { gte: since } }, { reviewedAt: { gte: since } }],
          ...scope,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          student: { select: { id: true, name: true } },
        },
        orderBy: [{ submittedAt: "desc" }, { reviewedAt: "desc" }],
        take: 20,
      }),
      prisma.student.findMany({
        where: { createdAt: { gte: since }, ...(isStudent && user?.studentId ? { id: user.studentId } : {}) },
        select: { id: true, name: true, createdAt: true, rollNumber: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.certificate.findMany({
        where: { issueDate: { gte: since }, ...scope },
        select: {
          id: true,
          certificateNumber: true,
          issueDate: true,
          student: { select: { id: true, name: true } },
        },
        orderBy: { issueDate: "desc" },
        take: 20,
      }),
    ]);

  for (const p of recentPayments) {
    items.push({
      id: p.id,
      type: "PAYMENT_RECEIVED",
      title: `Payment received · ${p.student.name}`,
      detail: `₹${p.amount.toLocaleString("en-IN")} collected for EMI #${p.number}`,
      href: `/students/${p.student.id}?tab=finance`,
      date: p.paymentDate?.toISOString() || new Date().toISOString(),
    });
  }

  for (const pf of recentPortfolios) {
    const isSubmit = !!pf.submittedAt;
    items.push({
      id: pf.id,
      type: "PORTFOLIO_ACTIVITY",
      title: `Portfolio ${isSubmit ? "submitted" : "reviewed"} · ${pf.student.name}`,
      detail: isSubmit
        ? `Portfolio submitted by ${pf.student.name}`
        : `Portfolio status is now ${pf.status.replace(/_/g, " ").toLowerCase()}`,
      href: `/students/${pf.student.id}?tab=portfolio`,
      date: (isSubmit ? pf.submittedAt : pf.reviewedAt)?.toISOString() || new Date().toISOString(),
    });
  }

  for (const s of recentAdmissions) {
    items.push({
      id: s.id,
      type: "NEW_ADMISSION",
      title: `New student · ${s.name}`,
      detail: `${s.rollNumber} admitted`,
      href: `/students/${s.id}`,
      date: s.createdAt.toISOString(),
    });
  }

  for (const c of recentCertificates) {
    items.push({
      id: c.id,
      type: "CERTIFICATE_ISSUED",
      title: `Certificate issued · ${c.student.name}`,
      detail: c.certificateNumber || "Certificate issued",
      href: `/students/${c.student.id}?tab=certificate`,
      date: c.issueDate?.toISOString() || new Date().toISOString(),
    });
  }

  // 2. Lead follow-up due
  const followUps = await prisma.leadFollowUp.findMany({
    where: {
      nextFollowUpDate: { lte: todayEnd },
      lead: { status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] } },
    },
    select: {
      lead: { select: { id: true, studentName: true } },
      nextFollowUpDate: true,
      id: true,
    },
    orderBy: { nextFollowUpDate: "asc" },
    take: 20,
  });
  for (const fu of followUps) {
    items.push({
      id: fu.id,
      type: "LEAD_FOLLOWUP",
      title: `Follow-up due · ${fu.lead.studentName}`,
      detail: `Next follow-up was scheduled for ${fu.nextFollowUpDate?.toLocaleDateString("en-IN")}`,
      href: `/leads/${fu.lead.id}`,
      date: fu.nextFollowUpDate?.toISOString() || new Date().toISOString(),
    });
  }

  // 3. Today's classes
  const todaysClasses = await prisma.studentClass.findMany({
    where: {
      plannedDate: { gte: todayStart, lte: todayEnd },
      attendance: "PENDING",
      ...scope,
    },
    select: {
      id: true,
      plannedDate: true,
      student: { select: { id: true, name: true } },
      class: { select: { name: true, module: { select: { name: true } } } },
    },
    take: 20,
  });
  for (const sc of todaysClasses) {
    items.push({
      id: sc.id,
      type: "TODAY_CLASS",
      title: `Class today · ${sc.student.name}`,
      detail: `${sc.class.module.name} — ${sc.class.name}`,
      href: `/students/${sc.student.id}?tab=classes`,
      date: sc.plannedDate?.toISOString() || new Date().toISOString(),
    });
  }

  // 4. EMI due today
  const emisDue = await prisma.eMI.findMany({
    where: {
      dueDate: { gte: todayStart, lte: todayEnd },
      status: { in: ["PENDING", "PARTIAL"] },
      ...scope,
    },
    select: {
      id: true,
      dueDate: true,
      amount: true,
      student: { select: { id: true, name: true } },
    },
    take: 20,
  });
  for (const e of emisDue) {
    items.push({
      id: e.id,
      type: "EMI_DUE",
      title: `EMI due today · ${e.student.name}`,
      detail: `Installment of ₹${e.amount.toLocaleString("en-IN")} due today`,
      href: `/students/${e.student.id}?tab=finance`,
      date: e.dueDate.toISOString(),
    });
  }

  // 5. Overdue EMIs
  const emisOverdue = await prisma.eMI.findMany({
    where: {
      dueDate: { lt: todayStart },
      status: { in: ["PENDING", "PARTIAL"] },
      ...scope,
    },
    select: {
      id: true,
      dueDate: true,
      amount: true,
      student: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  });
  for (const e of emisOverdue) {
    items.push({
      id: e.id,
      type: "EMI_OVERDUE",
      title: `Overdue EMI · ${e.student.name}`,
      detail: `₹${e.amount.toLocaleString("en-IN")} was due on ${e.dueDate.toLocaleDateString("en-IN")}`,
      href: `/students/${e.student.id}?tab=finance`,
      date: e.dueDate.toISOString(),
    });
  }

  // 6. Portfolio pending
  const portfoliosPending = await prisma.student.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "ACTIVE", "ON_HOLD"] },
      portfolios: { none: {} },
      expectedCompletionDate: { lte: monthEnd },
      ...(isStudent && user?.studentId ? { id: user.studentId } : {}),
    },
    select: { id: true, name: true, expectedCompletionDate: true },
    take: 20,
  });
  for (const s of portfoliosPending) {
    items.push({
      id: s.id,
      type: "PORTFOLIO_PENDING",
      title: `Portfolio pending · ${s.name}`,
      detail: "No portfolio started yet for this student",
      href: `/students/${s.id}?tab=portfolio`,
      date: s.expectedCompletionDate?.toISOString() || new Date().toISOString(),
    });
  }

  // 7. Certificate pending
  const certPending = await prisma.student.findMany({
    where: { status: "COMPLETED", ...(isStudent && user?.studentId ? { id: user.studentId } : {}) },
    select: { id: true, name: true, updatedAt: true },
    take: 20,
  });
  for (const s of certPending) {
    items.push({
      id: s.id,
      type: "CERTIFICATE_PENDING",
      title: `Certificate pending · ${s.name}`,
      detail: "Student has completed the course — issue certificate",
      href: `/students/${s.id}?tab=certificate`,
      date: s.updatedAt.toISOString(),
    });
  }

  // 8. Course completion this month
  const completing = await prisma.student.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "ACTIVE"] },
      expectedCompletionDate: { gte: todayStart, lte: monthEnd },
      ...(isStudent && user?.studentId ? { id: user.studentId } : {}),
    },
    select: { id: true, name: true, expectedCompletionDate: true, course: { select: { name: true } } },
    take: 20,
  });
  for (const s of completing) {
    items.push({
      id: s.id,
      type: "COURSE_COMPLETION",
      title: `Course completing · ${s.name}`,
      detail: `Expected completion on ${s.expectedCompletionDate?.toLocaleDateString("en-IN")} (${s.course.name})`,
      href: `/students/${s.id}`,
      date: s.expectedCompletionDate?.toISOString() || new Date().toISOString(),
    });
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}

export async function getNotificationCount(user?: Viewer | null): Promise<number> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const scope = studentScope(user);

  const [followups, todaysClasses, emisDue, emisOverdue, portfoliosPending, certPending] =
    await Promise.all([
      prisma.leadFollowUp.count({
        where: {
          nextFollowUpDate: { lte: todayEnd },
          lead: { status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] } },
        },
      }),
      prisma.studentClass.count({
        where: { plannedDate: { gte: todayStart, lte: todayEnd }, attendance: "PENDING", ...scope },
      }),
      prisma.eMI.count({
        where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "PARTIAL"] }, ...scope },
      }),
      prisma.eMI.count({
        where: { dueDate: { lt: todayStart }, status: { in: ["PENDING", "PARTIAL"] }, ...scope },
      }),
      prisma.student.count({
        where: {
          status: { in: ["IN_PROGRESS", "ACTIVE", "ON_HOLD"] },
          portfolios: { none: {} },
          ...(user?.role === ROLES.STUDENT && user.studentId ? { id: user.studentId } : {}),
        },
      }),
      prisma.student.count({
        where: { status: "COMPLETED", ...(user?.role === ROLES.STUDENT && user.studentId ? { id: user.studentId } : {}) },
      }),
    ]);

  return followups + todaysClasses + emisDue + emisOverdue + portfoliosPending + certPending;
}
