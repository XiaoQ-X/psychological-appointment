const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function reset() {
  await prisma.operationLog.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.shiftApplication.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.activitySignup.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.article.deleteMany();
  await prisma.message.deleteMany();
  await prisma.recommendationResult.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.appointmentRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.counselingRoom.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.counselor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.systemSetting.deleteMany();
}

async function main() {
  await reset();

  const passwordHash = await bcrypt.hash("123456", 10);

  const campuses = [];
  for (const item of [
    ["明德校区", "明德楼心理中心", "010-80010001"],
    ["求真校区", "求真楼 B 座 3 层", "010-80010002"],
    ["知行校区", "知行学生活动中心 2 层", "010-80010003"]
  ]) {
    campuses.push(await prisma.campus.create({
      data: { name: item[0], address: item[1], phone: item[2] }
    }));
  }

  for (let index = 0; index < 8; index += 1) {
    const campus = campuses[index % campuses.length];
    await prisma.counselingRoom.create({
      data: {
        name: `咨询室 ${String(index + 1).padStart(2, "0")}`,
        campusId: campus.id,
        location: `${campus.name} 心理中心 ${201 + index}`,
        capacity: index % 4 === 0 ? 2 : 1
      }
    });
  }

  for (const item of [
    ["admin", "心理中心管理员", "admin"],
    ["supervisor", "督导管理员", "supervisor"]
  ]) {
    await prisma.admin.create({
      data: {
        username: item[0],
        name: item[1],
        passwordHash,
        role: item[2]
      }
    });
  }

  await prisma.systemSetting.createMany({
    data: [
      {
        key: "appointmentRules",
        value: {
          durationMinutes: 50,
          advanceDays: 14,
          allowStudentCancel: true,
          autoConfirm: false
        },
        description: "预约规则"
      },
      {
        key: "emergencyHelp",
        value: {
          hotline: "010-80010000",
          address: "明德校区心理中心值班室",
          workTime: "周一至周五 08:30-18:00"
        },
        description: "紧急帮助配置"
      },
      {
        key: "privacyPolicy",
        value: {
          title: "安心心理隐私授权说明",
          updatedAt: "2026-06-01",
          content: "平台仅采集预约、咨询与安全评估所需的最小信息。"
        },
        description: "隐私政策"
      }
    ]
  });

  const counts = await Promise.all([
    prisma.admin.count(),
    prisma.campus.count(),
    prisma.counselingRoom.count(),
    prisma.student.count(),
    prisma.counselor.count(),
    prisma.schedule.count(),
    prisma.appointment.count(),
    prisma.article.count(),
    prisma.activity.count(),
    prisma.message.count()
  ]);

  console.log("Seed completed: minimal empty business baseline.");
  console.table({
    admins: counts[0],
    campuses: counts[1],
    rooms: counts[2],
    students: counts[3],
    counselors: counts[4],
    schedules: counts[5],
    appointments: counts[6],
    articles: counts[7],
    activities: counts[8],
    messages: counts[9]
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
