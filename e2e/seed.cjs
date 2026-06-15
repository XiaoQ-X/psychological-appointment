const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const fixtures = require("./fixtures.cjs");

const prisma = new PrismaClient();

function futureSlot(days, hour) {
  const startAt = new Date();
  startAt.setDate(startAt.getDate() + days);
  startAt.setHours(hour, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setMinutes(endAt.getMinutes() + 50);
  return { startAt, endAt };
}

async function main() {
  const campus = await prisma.campus.findFirst({ where: { status: "active" } });
  const room = await prisma.counselingRoom.findFirst({ where: { campusId: campus.id, status: "active" } });
  const [studentPasswordHash, miniPasswordHash, counselorPasswordHash] = await Promise.all([
    bcrypt.hash(fixtures.student.temporaryPassword, 10),
    bcrypt.hash(fixtures.miniStudent.temporaryPassword, 10),
    bcrypt.hash(fixtures.counselor.temporaryPassword, 10)
  ]);

  const student = await prisma.student.create({
    data: {
      studentNo: fixtures.student.account,
      name: fixtures.student.name,
      idCardLast6: "110001",
      passwordHash: studentPasswordHash,
      college: "测试学院",
      major: "心理测试",
      grade: "2026级",
      className: "E2E班",
      phone: "13800000001",
      campusId: campus.id,
      mustChangePassword: true
    }
  });
  await prisma.student.create({
    data: {
      studentNo: fixtures.miniStudent.account,
      name: fixtures.miniStudent.name,
      idCardLast6: "110002",
      passwordHash: miniPasswordHash,
      college: "测试学院",
      major: "小程序测试",
      grade: "2026级",
      className: "E2E班",
      phone: "13800000002",
      campusId: campus.id,
      mustChangePassword: true
    }
  });
  const counselor = await prisma.counselor.create({
    data: {
      jobNo: fixtures.counselor.account,
      name: fixtures.counselor.name,
      idCardLast6: "220001",
      passwordHash: counselorPasswordHash,
      title: "心理中心专职咨询师",
      phone: "13900000001",
      campusId: campus.id,
      specialties: ["学业压力", "情绪调节"],
      introduction: "用于独立浏览器端到端测试的咨询师账号。",
      mustChangePassword: true
    }
  });

  for (const [days, hour] of [[3, 9], [4, 14], [5, 10]]) {
    const slot = futureSlot(days, hour);
    await prisma.schedule.create({
      data: {
        counselorId: counselor.id,
        campusId: campus.id,
        roomId: room.id,
        ...slot,
        note: `E2E fixture for ${student.studentNo}`
      }
    });
  }

  console.log("E2E fixture seeded:", {
    students: [fixtures.student.account, fixtures.miniStudent.account],
    counselor: fixtures.counselor.account,
    schedules: 3
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
