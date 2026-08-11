import { prisma } from "@/lib/db";
import { addDays } from "@/lib/utils";

export async function mapCurriculumForStudent(studentId: string, courseId: string) {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { number: "asc" },
    include: { classes: { orderBy: { number: "asc" } }, projects: true },
  });

  const firstModule = modules[0];

  for (const m of modules) {
    await prisma.studentModule.create({
      data: {
        studentId,
        moduleId: m.id,
        status: m.id === firstModule?.id ? "IN_PROGRESS" : "YET_TO_START",
      },
    });

    for (const c of m.classes) {
      const isFirstClassOfFirstModule = m.id === firstModule?.id && c.number === 1;
      await prisma.studentClass.create({
        data: {
          studentId,
          classId: c.id,
          plannedDate: isFirstClassOfFirstModule ? addDays(new Date(), 1) : null,
          attendance: "PENDING",
        },
      });
    }

    for (const p of m.projects) {
      await prisma.studentProject.create({
        data: { studentId, projectId: p.id, status: "YET_TO_START" },
      });
    }
  }

  await prisma.portfolio.create({
    data: { studentId, status: "YET_TO_START" },
  });
  await prisma.certificate.create({
    data: { studentId, status: "NOT_ELIGIBLE" },
  });

  return modules.length;
}

export async function createEmiSchedule(params: {
  studentId: string;
  netFee: number;
  registrationFee: number;
  paymentType: string;
  courseStartDate: Date;
  emis?: { dueDate: string; amount: number }[];
}) {
  const { studentId, netFee, paymentType, courseStartDate, emis } = params;
  const remaining = Math.max(0, netFee);

  if (paymentType === "EMI" && emis && emis.length > 0) {
    const total = emis.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const amount = emis[0].amount + (remaining - total);

    for (let i = 0; i < emis.length; i++) {
      await prisma.eMI.create({
        data: {
          studentId,
          number: i + 1,
          dueDate: emis[i].dueDate ? new Date(emis[i].dueDate) : courseStartDate,
          amount: i === 0 ? Math.round(amount) : Math.round(emis[i].amount),
          balance: i === 0 ? Math.round(amount) : Math.round(emis[i].amount),
          status: "PENDING",
        },
      });
    }
    return;
  }

  const numEmis = paymentType === "EMI" ? 6 : 1;
  const amount = Math.round(remaining / numEmis);

  for (let i = 1; i <= numEmis; i++) {
    const dueDate = new Date(courseStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDate.setDate(10);
    await prisma.eMI.create({
      data: {
        studentId,
        number: i,
        dueDate,
        amount,
        balance: amount,
        status: "PENDING",
      },
    });
  }
}

export async function nextRollNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `ZMP-${year}-`;
  const last = await prisma.student.findFirst({
    where: { rollNumber: { startsWith: prefix } },
    orderBy: { rollNumber: "desc" },
    select: { rollNumber: true },
  });
  const nextNum = last ? parseInt(last.rollNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

export async function nextAvailableSlot(studentId: string, fromDate: Date): Promise<Date | null> {
  const availabilities = await prisma.availability.findMany({
    where: { studentId },
    orderBy: { dayOfWeek: "asc" },
  });
  if (availabilities.length === 0) return null;

  for (let i = 1; i <= 30; i++) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + i);
    const day = candidate.getDay();
    const slot = availabilities.find((a) => a.dayOfWeek === day);
    if (slot) {
      const [h, m] = slot.startTime.split(":").map(Number);
      candidate.setHours(h || 10, m || 0, 0, 0);
      return candidate;
    }
  }
  return null;
}

export async function autoSchedulePendingClasses(studentId: string, courseId: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return;

  // Pending classes with no planned date get the next available slots
  const pending = await prisma.studentClass.findMany({
    where: { studentId, attendance: "PENDING", plannedDate: null },
    include: { class: { include: { module: true } } },
    orderBy: [{ class: { module: { number: "asc" } } }, { class: { number: "asc" } }],
  });

  let cursor = new Date();
  for (const sc of pending) {
    const slot = await nextAvailableSlot(studentId, cursor);
    if (!slot) break;
    await prisma.studentClass.update({
      where: { id: sc.id },
      data: { plannedDate: slot },
    });
    cursor = slot;
  }
}

export async function updateModuleProgressFromClasses(studentId: string, moduleId: string) {
  const sm = await prisma.studentModule.findUnique({
    where: { studentId_moduleId: { studentId, moduleId } },
    include: { module: { select: { courseId: true } } },
  });
  if (!sm) return;

  const [classes, done] = await Promise.all([
    prisma.class.count({ where: { moduleId } }),
    prisma.studentClass.count({
      where: { studentId, class: { moduleId }, attendance: "PRESENT" },
    }),
  ]);
  if (classes > 0 && done === classes && sm.status !== "COMPLETED") {
    await prisma.studentModule.update({
      where: { id: sm.id },
      data: { status: "COMPLETED", completedDate: new Date() },
    });

    // If all modules completed, mark student completed
    const moduleCount = await prisma.module.count({ where: { courseId: sm.module.courseId } });
    const completedCount = await prisma.studentModule.count({
      where: { studentId, status: "COMPLETED" },
    });
    if (completedCount >= moduleCount) {
      await prisma.student.update({
        where: { id: studentId },
        data: { status: "COMPLETED" },
      });
    }
  }
}
