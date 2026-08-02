import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "@/lib/utils";

export interface DashboardStats {
  leads: {
    total: number;
    newToday: number;
    followUpToday: number;
    converted: number;
    conversionPercent: number;
  };
  students: {
    active: number;
    newAdmissions: number;
    inProgress: number;
    completed: number;
    certificatePending: number;
    certificateIssued: number;
  };
  academic: {
    todaysClasses: number;
    classesPending: number;
    projectsPending: number;
    portfolioPending: number;
    readyForFinalReview: number;
  };
  finance: {
    todaysCollection: number;
    monthlyCollection: number;
    outstandingFees: number;
    emisDueToday: number;
    overdueEmis: number;
  };
  courseStats: {
    byCourse: { name: string; count: number }[];
    byTutor: { name: string; count: number }[];
    byModule: { name: string; count: number }[];
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const [
    totalLeads,
    newLeadsToday,
    leadsFollowUpToday,
    leadsConverted,
    activeStudents,
    newAdmissions,
    inProgressStudents,
    completedStudents,
    certificatePending,
    certificateIssued,
    todaysClasses,
    classesPending,
    projectsPending,
    portfolioPending,
    readyForFinalReview,
    emisDueToday,
    overdueEmis,
    todayPayments,
    monthPayments,
    outstandingAgg,
    byCourse,
    byTutor,
    byModule,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { leadDate: { gte: todayStart } } }),
    prisma.leadFollowUp.count({
      where: {
        nextFollowUpDate: { gte: todayStart, lte: todayEnd },
        lead: { status: { notIn: ["CONVERTED", "LOST", "NOT_INTERESTED"] } },
      },
    }),
    prisma.lead.count({ where: { status: "CONVERTED" } }),
    prisma.student.count({ where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD"] } } }),
    prisma.student.count({ where: { joiningDate: { gte: monthStart } } }),
    prisma.student.count({ where: { status: "IN_PROGRESS" } }),
    prisma.student.count({ where: { status: "COMPLETED" } }),
    prisma.student.count({ where: { status: "COMPLETED" } }),
    prisma.student.count({ where: { status: "CERTIFICATE_ISSUED" } }),
    prisma.studentClass.count({
      where: { plannedDate: { gte: todayStart, lte: todayEnd }, attendance: "PENDING" },
    }),
    prisma.studentClass.count({
      where: { attendance: "PENDING", plannedDate: { gte: todayStart } },
    }),
    prisma.studentProject.count({ where: { status: { in: ["YET_TO_START", "IN_PROGRESS", "SUBMITTED", "INTERNAL_FEEDBACK", "REWORK_REQUIRED"] } } }),
    prisma.portfolio.count({ where: { status: { in: ["YET_TO_START", "IN_PROGRESS"] } } }),
    prisma.student.count({
      where: {
        status: { in: ["IN_PROGRESS", "ACTIVE"] },
        portfolios: { some: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } },
      },
    }),
    prisma.eMI.count({
      where: { dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ["PENDING", "PARTIAL"] } },
    }),
    prisma.eMI.count({
      where: { dueDate: { lt: todayStart }, status: { in: ["PENDING", "PARTIAL"] } },
    }),
    prisma.eMI.aggregate({
      where: { paymentDate: { gte: todayStart, lte: todayEnd }, status: "PAID" },
      _sum: { amountPaid: true },
    }),
    prisma.eMI.aggregate({
      where: { paymentDate: { gte: monthStart, lte: monthEnd }, status: "PAID" },
      _sum: { amountPaid: true },
    }),
    prisma.eMI.aggregate({
      where: { status: { in: ["PENDING", "PARTIAL"] } },
      _sum: { balance: true },
    }),
    prisma.student.groupBy({
      by: ["courseId"],
      _count: { _all: true },
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD"] } },
    }),
    prisma.student.groupBy({
      by: ["tutorId"],
      _count: { _all: true },
      where: { status: { in: ["ACTIVE", "IN_PROGRESS", "ON_HOLD"] } },
    }),
    prisma.studentModule.groupBy({
      by: ["moduleId"],
      _count: { _all: true },
      where: { status: "IN_PROGRESS" },
    }),
  ]);

  const courses = await prisma.course.findMany({ select: { id: true, name: true } });
  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    select: { id: true, name: true },
  });
  const modules = await prisma.module.findMany({
    select: { id: true, name: true, course: { select: { name: true } } },
  });

  const byCourseMap = new Map(byCourse.map((b) => [b.courseId, b._count?._all ?? 0]));
  const byTutorMap = new Map(byTutor.map((b) => [b.tutorId, b._count?._all ?? 0]));
  const byModuleMap = new Map(byModule.map((b) => [b.moduleId, b._count?._all ?? 0]));

  const conversionPercent =
    totalLeads > 0 ? Math.round((leadsConverted / totalLeads) * 1000) / 10 : 0;

  return {
    leads: {
      total: totalLeads,
      newToday: newLeadsToday,
      followUpToday: leadsFollowUpToday,
      converted: leadsConverted,
      conversionPercent,
    },
    students: {
      active: activeStudents,
      newAdmissions,
      inProgress: inProgressStudents,
      completed: completedStudents,
      certificatePending,
      certificateIssued,
    },
    academic: {
      todaysClasses,
      classesPending,
      projectsPending,
      portfolioPending,
      readyForFinalReview,
    },
    finance: {
      todaysCollection: todayPayments._sum.amountPaid || 0,
      monthlyCollection: monthPayments._sum.amountPaid || 0,
      outstandingFees: outstandingAgg._sum.balance || 0,
      emisDueToday,
      overdueEmis,
    },
    courseStats: {
      byCourse: courses
        .map((c) => ({ name: c.name, count: byCourseMap.get(c.id) || 0 }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count),
      byTutor: tutors
        .map((t) => ({ name: t.name, count: byTutorMap.get(t.id) || 0 }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count),
      byModule: modules
        .map((m) => ({ name: `${m.course.name} — ${m.name}`, count: byModuleMap.get(m.id) || 0 }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    },
  };
}
