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

export async function getNotifications(): Promise<NotificationItem[]> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();
  const items: NotificationItem[] = [];

  // 1. Lead follow-up due
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

  // 2. Today's classes
  const todaysClasses = await prisma.studentClass.findMany({
    where: {
      plannedDate: { gte: todayStart, lte: todayEnd },
      attendance: "PENDING",
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

  // 3. EMI due today
  const emisDue = await prisma.eMI.findMany({
    where: {
      dueDate: { gte: todayStart, lte: todayEnd },
      status: { in: ["PENDING", "PARTIAL"] },
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

  // 4. Overdue EMIs
  const emisOverdue = await prisma.eMI.findMany({
    where: {
      dueDate: { lt: todayStart },
      status: { in: ["PENDING", "PARTIAL"] },
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

  // 5. Portfolio pending
  const portfoliosPending = await prisma.student.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "ACTIVE", "ON_HOLD"] },
      portfolios: { none: {} },
      expectedCompletionDate: { lte: monthEnd },
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

  // 6. Certificate pending
  const certPending = await prisma.student.findMany({
    where: { status: "COMPLETED" },
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

  // 7. Course completion this month
  const completing = await prisma.student.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "ACTIVE"] },
      expectedCompletionDate: { gte: todayStart, lte: monthEnd },
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

  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return items;
}

export async function getNotificationCount(): Promise<number> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [followups, todaysClasses, emisDue, emisOverdue, portfoliosPending, certPending] =
    await Promise.all([
      prisma.leadFollowUp.count({
        where: {
          nextFollowUpDate: { lte: todayEnd },
          lead: { status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] } },
        },
      }),
      prisma.studentClass.count({
        where: { plannedDate: { gte: todayStart, lte: todayEnd }, attendance: "PENDING" },
      }),
      prisma.eMI.count({
        where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "PARTIAL"] } },
      }),
      prisma.eMI.count({
        where: { dueDate: { lt: todayStart }, status: { in: ["PENDING", "PARTIAL"] } },
      }),
      prisma.student.count({
        where: {
          status: { in: ["IN_PROGRESS", "ACTIVE", "ON_HOLD"] },
          portfolios: { none: {} },
        },
      }),
      prisma.student.count({ where: { status: "COMPLETED" } }),
    ]);

  return followups + todaysClasses + emisDue + emisOverdue + portfoliosPending + certPending;
}
