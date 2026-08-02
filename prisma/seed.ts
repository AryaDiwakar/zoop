import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const monthStart = new Date();
monthStart.setDate(1);

function d(offsetDays: number, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateInMonth(day: number, hour = 10) {
  const date = new Date();
  date.setDate(Math.min(day, 28));
  date.setHours(hour, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Seeding database…");
  await prisma.auditLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.eMI.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.studentProject.deleteMany();
  await prisma.studentClass.deleteMany();
  await prisma.studentModule.deleteMany();
  await prisma.leadFollowUp.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.student.deleteMany();
  await prisma.project.deleteMany();
  await prisma.class.deleteMany();
  await prisma.module.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("zoop1234", 10);

  // Users ---------------------------------------------------------------
  const admin = await prisma.user.create({
    data: { name: "Arya Diwakar", email: "admin@zoop.academy", passwordHash: password, role: "SUPER_ADMIN", phone: "+91 90000 00001" },
  });
  const counsellor = await prisma.user.create({
    data: { name: "Priya Sharma", email: "counsellor@zoop.academy", passwordHash: password, role: "COUNSELLOR", phone: "+91 90000 00002" },
  });
  const tutor = await prisma.user.create({
    data: { name: "Rahul Verma", email: "tutor@zoop.academy", passwordHash: password, role: "TUTOR", phone: "+91 90000 00003" },
  });
  const tutor2 = await prisma.user.create({
    data: { name: "Sneha Patel", email: "tutor2@zoop.academy", passwordHash: password, role: "TUTOR", phone: "+91 90000 00004" },
  });
  const finance = await prisma.user.create({
    data: { name: "Karan Mehta", email: "finance@zoop.academy", passwordHash: password, role: "FINANCE", phone: "+91 90000 00005" },
  });

  // Courses --------------------------------------------------------------
  const uiux = await prisma.course.create({
    data: {
      name: "UI/UX Design Pro",
      code: "UIUX-01",
      description: "Complete UI/UX design course from fundamentals to a professional portfolio.",
      durationMonths: 6,
      totalModules: 24,
      level: "INTERMEDIATE",
      learningPattern: "Classroom + Project-based",
      softwareUsed: ["Figma", "Adobe XD", "Photoshop", "Illustrator"],
      aiTools: ["Midjourney", "ChatGPT", "Uizard"],
      expectedOutcomes: "Build a professional 10-project portfolio and industry-ready design skills.",
      careerOpportunities: "UI Designer, UX Designer, Product Designer, Design Consultant",
      status: "ACTIVE",
    },
  });
  const motion = await prisma.course.create({
    data: {
      name: "Motion Graphics",
      code: "MOTION-01",
      description: "Learn animation and motion graphics with After Effects and Premiere Pro.",
      durationMonths: 4,
      totalModules: 16,
      level: "BEGINNER",
      learningPattern: "Classroom + Project-based",
      softwareUsed: ["After Effects", "Premiere Pro", "Photoshop"],
      aiTools: ["Runway", "ChatGPT"],
      expectedOutcomes: "Produce social media animations, title sequences and motion reels.",
      careerOpportunities: "Motion Designer, Video Editor, Animator",
      status: "ACTIVE",
    },
  });
  const graphic = await prisma.course.create({
    data: {
      name: "Graphic Design",
      code: "GRA-01",
      description: "Master graphic design with Photoshop, Illustrator and visual identity projects.",
      durationMonths: 3,
      totalModules: 12,
      level: "BEGINNER",
      learningPattern: "Classroom + Project-based",
      softwareUsed: ["Photoshop", "Illustrator", "InDesign"],
      aiTools: ["Midjourney", "Firefly"],
      expectedOutcomes: "Design logos, posters, brochures and complete brand identities.",
      careerOpportunities: "Graphic Designer, Brand Designer, Visualizer",
      status: "ACTIVE",
    },
  });

  async function addCurriculum(courseId: string, moduleDefs: { name: string; classes: { name: string; topic: string; exercise: string }[]; project?: { name: string; desc: string; deliverables: string; hours: number } }[]) {
    let moduleNum = 1;
    let classNum = 1;
    for (const m of moduleDefs) {
      const mod = await prisma.module.create({
        data: {
          courseId,
          number: moduleNum,
          name: m.name,
          description: `${m.name} for the ${(await prisma.course.findUnique({ where: { id: courseId } }))?.name} program.`,
          learningObjectives: `Understand and apply ${m.name} concepts in real projects.`,
          totalClasses: m.classes.length,
        },
      });
      for (const c of m.classes) {
        await prisma.class.create({
          data: {
            moduleId: mod.id,
            number: classNum,
            name: c.name,
            learningTopic: c.topic,
            practicalExercise: c.exercise,
            durationMinutes: 120,
            tutorNotes: "Ensure students practice along with the session.",
          },
        });
        classNum++;
      }
      if (m.project) {
        await prisma.project.create({
          data: {
            courseId,
            moduleId: mod.id,
            name: m.project.name,
            description: m.project.desc,
            deliverables: m.project.deliverables,
            difficulty: "INTERMEDIATE",
            estimatedHours: m.project.hours,
            evaluationCriteria: "Creativity, technical execution, adherence to brief and presentation.",
          },
        });
      }
      moduleNum++;
    }
  }

  await addCurriculum(uiux.id, [
    {
      name: "Design Fundamentals",
      classes: [
        { name: "Introduction to Design", topic: "Design principles, color theory, typography basics", exercise: "Create a mood board for a food brand" },
        { name: "Color Theory", topic: "Color models, harmony, accessibility", exercise: "Build a 5-color palette for a fitness app" },
        { name: "Typography", topic: "Typefaces, hierarchy, pairing", exercise: "Design a type specimen poster" },
      ],
      project: { name: "Design Principles Board", desc: "Demonstrate understanding of design principles.", deliverables: "Figma board with principles applied", hours: 8 },
    },
    {
      name: "Figma Fundamentals",
      classes: [
        { name: "Workspace Overview", topic: "Frames, layers, panels, shortcuts", exercise: "Recreate a mobile screen" },
        { name: "Frames & Layout", topic: "Auto layout, constraints, grids", exercise: "Build a responsive card layout" },
        { name: "Components & Variants", topic: "Reusable components, properties", exercise: "Create a button system with variants" },
      ],
      project: { name: "Figma Component Library", desc: "Build a reusable component library.", deliverables: "Figma file with 10+ components", hours: 10 },
    },
    {
      name: "Wireframing & Prototyping",
      classes: [
        { name: "User Flows", topic: "UX flows, sitemaps, journeys", exercise: "Map a food delivery flow" },
        { name: "Low-fi Wireframes", topic: "Rapid sketching and grayscale frames", exercise: "Wireframe 5 key screens" },
        { name: "Interactive Prototyping", topic: "Smart animate, overlays, micro-interactions", exercise: "Prototype a login flow" },
      ],
      project: { name: "Food Delivery App", desc: "Design a complete food delivery app.", deliverables: "Wireframes + interactive prototype", hours: 16 },
    },
    {
      name: "Design Systems",
      classes: [
        { name: "Design Tokens", topic: "Colors, spacing, radii as tokens", exercise: "Define tokens for a product" },
        { name: "UI Kits", topic: "Building scalable UI kits", exercise: "Assemble a UI kit from components" },
        { name: "Documentation", topic: "Documenting components and usage", exercise: "Document 5 components" },
      ],
      project: { name: "Design System", desc: "Complete design system with documentation.", deliverables: "Tokens, UI kit, docs", hours: 20 },
    },
  ]);

  await addCurriculum(motion.id, [
    {
      name: "After Effects Basics",
      classes: [
        { name: "Interface & Workflow", topic: "Compositions, layers, timeline", exercise: "Animate a logo reveal" },
        { name: "Keyframes & Easing", topic: "Animation curves and motion", exercise: "Animate a bouncing ball" },
        { name: "Shapes & Masks", topic: "Shape layers, masks, track mattes", exercise: "Kinetic typography intro" },
      ],
      project: { name: "Logo Animation", desc: "Animate a client logo.", deliverables: "MP4 + project file", hours: 8 },
    },
    {
      name: "Motion Principles",
      classes: [
        { name: "Timing & Spacing", topic: "12 principles of animation", exercise: "Animate a text reveal" },
        { name: "Expressions", topic: "Basic expressions in AE", exercise: "Add wiggle to an element" },
        { name: "Typography Animation", topic: "Title sequences and lower thirds", exercise: "Design a lower third set" },
      ],
      project: { name: "Title Sequence", desc: "Create a 15s title sequence.", deliverables: "15s rendered sequence", hours: 12 },
    },
  ]);

  await addCurriculum(graphic.id, [
    {
      name: "Photoshop Essentials",
      classes: [
        { name: "Workspace & Selection", topic: "Layers, selection tools, masking", exercise: "Composite two photos" },
        { name: "Color & Retouching", topic: "Adjustments, healing, dodge & burn", exercise: "Retouch a portrait" },
        { name: "Typography & Posters", topic: "Poster design workflow", exercise: "Design an event poster" },
      ],
      project: { name: "Event Poster Series", desc: "Design a series of 3 event posters.", deliverables: "3 posters (print-ready)", hours: 10 },
    },
    {
      name: "Illustrator & Branding",
      classes: [
        { name: "Vector Basics", topic: "Pen tool, shapes, pathfinder", exercise: "Trace a logo to vector" },
        { name: "Logo Design", topic: "Logo ideation and construction", exercise: "Design a logo with variations" },
        { name: "Brand Identity", topic: "Stationery, color, brand guidelines", exercise: "Create brand guidelines page" },
      ],
      project: { name: "Brand Identity", desc: "Complete identity for a cafe.", deliverables: "Logo + guidelines PDF", hours: 14 },
    },
  ]);

  // Batches ---------------------------------------------------------------
  const b1 = await prisma.batch.create({
    data: { name: "UI/UX Morning Batch", courseId: uiux.id, tutorId: tutor.id, startDate: dateInMonth(1), timings: "Mon/Wed/Fri 10 AM – 12 PM", status: "ACTIVE" },
  });
  const b2 = await prisma.batch.create({
    data: { name: "UI/UX Evening Batch", courseId: uiux.id, tutorId: tutor2.id, startDate: dateInMonth(5), timings: "Tue/Thu/Sat 6 PM – 8 PM", status: "ACTIVE" },
  });

  // Leads ----------------------------------------------------------------
  const leadDefs = [
    { studentName: "Ananya Iyer", parentName: "S. Iyer", mobile: "+91 98111 00001", altMobile: "+91 98111 10001", email: "ananya.iyer@gmail.com", address: "Andheri West, Mumbai", qualification: "B.Com", college: "Mithibai College", interestedCourse: "UI/UX Design Pro", leadSource: "INSTAGRAM", counsellorId: counsellor.id, status: "CONVERTED", remarks: "Very keen on a career switch to design.", offset: -12 },
    { studentName: "Mohammed Faisal", parentName: "M. Raza", mobile: "+91 98222 00002", altMobile: "", email: "faisal.md@gmail.com", address: "Bandra East, Mumbai", qualification: "B.Sc IT", college: "St. Xavier's", interestedCourse: "Motion Graphics", leadSource: "GOOGLE_ADS", counsellorId: counsellor.id, status: "FOLLOW_UP", remarks: "Comparing with a YouTube course.", offset: -4 },
    { studentName: "Ritika Jain", parentName: "R. Jain", mobile: "+91 98333 00003", altMobile: "+91 98333 10003", email: "ritika.jain@gmail.com", address: "Goregaon, Mumbai", qualification: "12th (Arts)", college: "—", interestedCourse: "Graphic Design", leadSource: "FACEBOOK", counsellorId: counsellor.id, status: "DEMO_ATTENDED", remarks: "Loved the demo. Need fee plan.", offset: -2 },
    { studentName: "Arjun Nair", parentName: "P. Nair", mobile: "+91 98444 00004", altMobile: "", email: "arjun.nair@gmail.com", address: "Powai, Mumbai", qualification: "B.Tech CS", college: "VJTI", interestedCourse: "UI/UX Design Pro", leadSource: "WEBSITE", counsellorId: counsellor.id, status: "INTERESTED", remarks: "Asking about weekend batches.", offset: -1 },
    { studentName: "Sana Khan", parentName: "A. Khan", mobile: "+91 98555 00005", altMobile: "+91 98555 10005", email: "sana.khan@gmail.com", address: "Malad, Mumbai", qualification: "BA", college: "KC College", interestedCourse: "Motion Graphics", leadSource: "REFERRAL", counsellorId: counsellor.id, status: "NEW", remarks: "Referred by an alumni student.", offset: 0 },
    { studentName: "Dev Patel", parentName: "H. Patel", mobile: "+91 98666 00006", altMobile: "", email: "dev.patel@gmail.com", address: "Dadar, Mumbai", qualification: "BBA", college: "NM College", interestedCourse: "UI/UX Design Pro", leadSource: "WALK_IN", counsellorId: counsellor.id, status: "CONTACTED", remarks: "Walked in to enquire about courses.", offset: -3 },
    { studentName: "Meera Krishnan", parentName: "V. Krishnan", mobile: "+91 98777 00007", altMobile: "+91 98777 10007", email: "meera.k@gmail.com", address: "Chembur, Mumbai", qualification: "B.Des", college: "NIFT", interestedCourse: "UI/UX Design Pro", leadSource: "PHONE", counsellorId: counsellor.id, status: "LOST", remarks: "Chose another institute.", offset: -20 },
    { studentName: "Kabir Singh", parentName: "S. Singh", mobile: "+91 98888 00008", altMobile: "", email: "kabir.singh@gmail.com", address: "Versova, Mumbai", qualification: "12th (Science)", college: "—", interestedCourse: "Graphic Design", leadSource: "GOOGLE_ADS", counsellorId: counsellor.id, status: "NOT_INTERESTED", remarks: "Budget constraint.", offset: -15 },
  ];

  for (const [i, l] of leadDefs.entries()) {
    const lead = await prisma.lead.create({
      data: {
        leadDate: d(l.offset, 9 + (i % 8)),
        studentName: l.studentName,
        parentName: l.parentName,
        mobile: l.mobile,
        altMobile: l.altMobile,
        email: l.email,
        address: l.address,
        qualification: l.qualification,
        college: l.college,
        interestedCourse: l.interestedCourse,
        leadSource: l.leadSource,
        counsellorId: l.counsellorId,
        status: l.status,
        remarks: l.remarks,
      },
    });
    await prisma.leadFollowUp.create({
      data: {
        leadId: lead.id,
        followUpDate: d(l.offset + 2, 11),
        discussionNotes: "Discussed course structure and fee options.",
        contactMethod: "PHONE",
        nextFollowUpDate: l.status === "CONVERTED" ? null : d(l.offset + 5, 12),
        counsellorRemarks: l.status === "CONVERTED" ? "Enrolled in the course." : "Follow up again this week.",
        userId: counsellor.id,
      },
    });
  }

  // Students --------------------------------------------------------------
  const studentsDefs = [
    {
      rollNumber: "ZMP-2026-001", name: "Ananya Iyer", parentName: "S. Iyer", mobile: "+91 98111 00001", altMobile: "+91 98111 10001",
      email: "ananya.iyer@gmail.com", address: "Andheri West, Mumbai", qualification: "B.Com", occupation: "Customer Support Exec",
      courseId: uiux.id, batchId: b1.id, tutorId: tutor.id, status: "IN_PROGRESS", offset: -12,
      courseFee: 55000, registrationFee: 2000, discount: 5000, netFee: 52000, paymentType: "EMI",
      availability: [{ day: 1, start: "10:00", end: "12:00" }, { day: 3, start: "10:00", end: "12:00" }, { day: 5, start: "10:00", end: "12:00" }],
      moduleIdx: 1, classIdx: 2, projectIdx: 0,
    },
    {
      rollNumber: "ZMP-2026-002", name: "Aditya Rao", parentName: "K. Rao", mobile: "+91 91234 00001", altMobile: "",
      email: "aditya.rao@gmail.com", address: "Thane, Mumbai", qualification: "B.Tech IT", occupation: "Graduate",
      courseId: uiux.id, batchId: b1.id, tutorId: tutor.id, status: "ACTIVE", offset: -10,
      courseFee: 55000, registrationFee: 2000, discount: 3000, netFee: 54000, paymentType: "EMI",
      availability: [{ day: 1, start: "10:00", end: "12:00" }, { day: 3, start: "10:00", end: "12:00" }, { day: 5, start: "10:00", end: "12:00" }],
      moduleIdx: 0, classIdx: 0, projectIdx: -1,
    },
    {
      rollNumber: "ZMP-2026-003", name: "Isha Mehta", parentName: "D. Mehta", mobile: "+91 91234 00002", altMobile: "+91 91234 10002",
      email: "isha.mehta@gmail.com", address: "Andheri East, Mumbai", qualification: "B.Des", occupation: "Freelance Designer",
      courseId: uiux.id, batchId: b2.id, tutorId: tutor2.id, status: "COMPLETED", offset: -45,
      courseFee: 55000, registrationFee: 2000, discount: 2000, netFee: 55000, paymentType: "LUMPSUM",
      availability: [{ day: 2, start: "18:00", end: "20:00" }, { day: 4, start: "18:00", end: "20:00" }, { day: 6, start: "10:00", end: "13:00" }],
      moduleIdx: 3, classIdx: 2, projectIdx: 2, completed: true,
    },
    {
      rollNumber: "ZMP-2026-004", name: "Rohan Gupta", parentName: "A. Gupta", mobile: "+91 91234 00003", altMobile: "",
      email: "rohan.gupta@gmail.com", address: "Borivali, Mumbai", qualification: "BMM", occupation: "Video Editor",
      courseId: motion.id, tutorId: tutor2.id, status: "IN_PROGRESS", offset: -8,
      courseFee: 42000, registrationFee: 2000, discount: 2000, netFee: 42000, paymentType: "EMI",
      availability: [{ day: 0, start: "16:00", end: "18:00" }, { day: 2, start: "16:00", end: "18:00" }, { day: 4, start: "16:00", end: "18:00" }],
      moduleIdx: 1, classIdx: 0, projectIdx: 0,
    },
    {
      rollNumber: "ZMP-2026-005", name: "Neha Kulkarni", parentName: "S. Kulkarni", mobile: "+91 91234 00004", altMobile: "+91 91234 10004",
      email: "neha.kulkarni@gmail.com", address: "Pune", qualification: "BA", occupation: "Homemaker",
      courseId: graphic.id, tutorId: tutor.id, status: "ON_HOLD", offset: -6,
      courseFee: 32000, registrationFee: 1500, discount: 1500, netFee: 32000, paymentType: "EMI",
      availability: [{ day: 6, start: "10:00", end: "13:00" }],
      moduleIdx: 0, classIdx: 1, projectIdx: -1,
    },
    {
      rollNumber: "ZMP-2026-006", name: "Vikram Shah", parentName: "M. Shah", mobile: "+91 91234 00005", altMobile: "",
      email: "vikram.shah@gmail.com", address: "Vile Parle, Mumbai", qualification: "B.E. Mech", occupation: "Engineer",
      courseId: graphic.id, tutorId: tutor.id, status: "DROPPED", offset: -30,
      courseFee: 32000, registrationFee: 1500, discount: 0, netFee: 33500, paymentType: "EMI",
      availability: [{ day: 1, start: "19:00", end: "21:00" }],
      moduleIdx: 0, classIdx: 0, projectIdx: -1,
    },
  ];

  for (const s of studentsDefs) {
    const course = await prisma.course.findUniqueOrThrow({ where: { id: s.courseId } });
    const student = await prisma.student.create({
      data: {
        rollNumber: s.rollNumber,
        name: s.name,
        parentName: s.parentName,
        mobile: s.mobile,
        altMobile: s.altMobile,
        email: s.email,
        address: s.address,
        qualification: s.qualification,
        occupation: s.occupation,
        joiningDate: dateInMonth(Math.max(1, new Date().getDate())),
        dob: new Date(2000, 1, 15),
        emergencyContact: s.mobile,
        status: s.status,
        courseId: s.courseId,
        batchId: s.batchId || null,
        tutorId: s.tutorId,
        courseStartDate: dateInMonth(1),
        expectedCompletionDate: d(-s.offset + (s.completed ? -20 : 60)),
        courseDurationMonths: course.durationMonths,
        leadId: s.rollNumber === "ZMP-2026-001" ? (await prisma.lead.findFirst({ where: { studentName: "Ananya Iyer" } }))?.id : null,
        courseFee: s.courseFee,
        registrationFee: s.registrationFee,
        discount: s.discount,
        netFee: s.netFee,
        paymentType: s.paymentType,
        paymentTerms: s.paymentType === "EMI" ? "6 monthly installments" : "Full payment at admission",
      },
    });

    // Availability
    for (const a of s.availability) {
      await prisma.availability.create({ data: { studentId: student.id, dayOfWeek: a.day, startTime: a.start, endTime: a.end } });
    }

    // Map full curriculum
    const modules = await prisma.module.findMany({ where: { courseId: s.courseId }, orderBy: { number: "asc" } });
    for (const m of modules) {
      const classes = await prisma.class.findMany({ where: { moduleId: m.id }, orderBy: { number: "asc" } });
      const projects = await prisma.project.findMany({ where: { moduleId: m.id } });
      const mIdx = modules.indexOf(m);
      const isCurrentModule = s.completed ? mIdx < modules.length : mIdx === s.moduleIdx;
      const started = s.completed ? true : mIdx <= s.moduleIdx;
      const moduleStatus = s.completed ? "COMPLETED" : mIdx < s.moduleIdx ? "COMPLETED" : mIdx === s.moduleIdx ? "IN_PROGRESS" : "YET_TO_START";

      await prisma.studentModule.create({
        data: {
          studentId: student.id,
          moduleId: m.id,
          status: moduleStatus,
          completedDate: s.completed || mIdx < s.moduleIdx ? d(-s.offset - 5, 18) : null,
        },
      });

      for (const [ci, cl] of classes.entries()) {
        const isPastClass = isCurrentModule && s.completed
          ? true
          : mIdx < s.moduleIdx || (mIdx === s.moduleIdx && ci < s.classIdx);
        let attendance = "PENDING";
        let planned = d(-s.offset + ci * 2, 10);
        let actual: Date | null = null;
        if (isPastClass) {
          attendance = ci % 4 === 0 ? "ABSENT" : "PRESENT";
          actual = new Date(planned);
          actual.setDate(actual.getDate() + (attendance === "ABSENT" ? 2 : 0));
          planned = attendance === "ABSENT" ? new Date(actual) : planned;
        }
        await prisma.studentClass.create({
          data: {
            studentId: student.id,
            classId: cl.id,
            plannedDate: planned,
            actualDate: actual,
            attendance,
            tutorId: s.tutorId,
            remarks: attendance === "ABSENT" ? "Auto-rescheduled to next available slot" : null,
          },
        });
        if (attendance !== "PENDING") {
          await prisma.attendance.create({
            data: {
              date: actual || planned,
              time: "10:00",
              studentId: student.id,
              tutorId: s.tutorId,
              moduleId: m.id,
              classId: cl.id,
              status: attendance,
              remarks: attendance === "ABSENT" ? "Missed class — auto rescheduled" : null,
            },
          });
        }
      }

      for (const [pi, p] of projects.entries()) {
        const projIdx = s.projectIdx === -1 ? 999 : s.projectIdx;
        const projectStatus = s.completed
          ? "APPROVED"
          : mIdx < s.moduleIdx || (mIdx === s.moduleIdx && pi < projIdx)
            ? "APPROVED"
            : mIdx === s.moduleIdx && pi === projIdx
              ? "IN_PROGRESS"
              : "YET_TO_START";
        await prisma.studentProject.create({
          data: {
            studentId: student.id,
            projectId: p.id,
            status: projectStatus,
            submissionDate: ["APPROVED", "SUBMITTED", "INTERNAL_FEEDBACK", "REWORK_REQUIRED"].includes(projectStatus) ? d(-s.offset - 3, 18) : null,
            approvalDate: projectStatus === "APPROVED" ? d(-s.offset - 1, 18) : null,
            facultyFeedback: projectStatus === "APPROVED" ? "Excellent work. Great attention to detail." : null,
            projectLink: projectStatus === "APPROVED" ? "https://behance.net/student" : null,
          },
        });
      }
    }

    // Portfolio
    if (s.completed) {
      await prisma.portfolio.create({
        data: {
          studentId: student.id,
          status: "APPROVED",
          behanceLink: "https://behance.net/" + s.name.toLowerCase().replace(/\s/g, ""),
          dribbbleLink: "https://dribbble.com/" + s.name.toLowerCase().replace(/\s/g, ""),
          websiteLink: "https://" + s.name.toLowerCase().replace(/\s/g, "") + ".portfolio",
          facultyReview: "A well-rounded portfolio. Ready for job applications.",
          submittedAt: d(-10, 18),
          reviewedAt: d(-5, 18),
        },
      });
    }

    // Finance / EMI
    const numEmis = s.paymentType === "EMI" ? 6 : 1;
    const emiAmount = Math.round((s.netFee - s.registrationFee) / numEmis);
    for (let e = 1; e <= numEmis; e++) {
      const due = dateInMonth(e * 5, 10);
      const paid = e <= Math.ceil(s.offset / 5) && s.status !== "DROPPED" ? true : false;
      await prisma.eMI.create({
        data: {
          studentId: student.id,
          number: e,
          dueDate: due,
          amount: emiAmount,
          paymentDate: paid ? new Date(due.getTime() + 86400000) : null,
          amountPaid: paid ? emiAmount : 0,
          balance: paid ? 0 : emiAmount,
          receiptNumber: paid ? `RCP-${student.rollNumber.slice(-3)}-${String(e).padStart(2, "0")}` : null,
          transactionRef: paid ? `TXN${Math.floor(Math.random() * 1000000)}` : null,
          paymentMode: paid ? (e % 2 === 0 ? "UPI" : "CASH") : null,
          status: paid ? "PAID" : due < new Date() ? "OVERDUE" : "PENDING",
        },
      });
    }

    // Certificate
    if (s.completed) {
      await prisma.certificate.create({
        data: {
          studentId: student.id,
          status: "ISSUED",
          certificateNumber: `ZOO-CERT-${1000 + parseInt(s.rollNumber.slice(-3))}`,
          issueDate: d(-2, 12),
          issuedById: admin.id,
          remarks: "Top 5% of batch",
        },
      });
    } else if (s.status === "IN_PROGRESS" || s.status === "ACTIVE") {
      await prisma.certificate.create({
        data: { studentId: student.id, status: "NOT_ELIGIBLE" },
      });
    }
  }

  // Audit log samples
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "LOGIN", entity: "User", entityId: admin.id, details: "Super admin signed in" },
      { userId: counsellor.id, action: "LEAD_CREATE", entity: "Lead", details: "Created lead — Sana Khan" },
      { userId: counsellor.id, action: "LEAD_CONVERT", entity: "Lead", details: "Converted lead — Ananya Iyer to student ZMP-2026-001" },
      { userId: finance.id, action: "EMI_COLLECTION", entity: "EMI", details: "Collected EMI payment" },
      { userId: admin.id, action: "CERTIFICATE_ISSUE", entity: "Certificate", details: "Issued certificate ZOO-CERT-1003" },
    ],
  });

  console.log("Seed complete ✓");
  console.log("Login with admin@zoop.academy / zoop1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
