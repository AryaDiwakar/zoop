import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Clearing database…");
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

  const passwordHash = await bcrypt.hash("zoop1234", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@zoop.academy",
      passwordHash,
      role: "SUPER_ADMIN",
      phone: "+91 90000 00000",
      active: true,
    },
  });

  console.log("Database cleared ✓");
  console.log("Login: admin@zoop.academy / zoop1234");
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
