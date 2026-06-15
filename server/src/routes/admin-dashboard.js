function startOfLocalDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dateKey(date) {
  return startOfLocalDay(date).toISOString().slice(0, 10);
}

function lastDays(count) {
  const today = startOfLocalDay(new Date());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - index - 1));
    return date;
  });
}

function registerAdminDashboardRoutes(app, dependencies) {
  const {
    prisma,
    success,
    asyncHandler,
    requireAuth,
    appointmentInclude,
    safeAppointment
  } = dependencies;

  app.get("/api/admin/dashboard", requireAuth(["admin"]), asyncHandler(async (req, res) => {
    const trendDays = lastDays(7);
    const trendStart = trendDays[0];
    const [
      students,
      counselors,
      appointments,
      pending,
      risks,
      activities,
      schedules,
      pendingShifts,
      pendingReferrals,
      pendingFeedbacks,
      statusGroups,
      typeGroups,
      trendRows,
      recentAppointments,
      recentLogs
    ] = await Promise.all([
      prisma.student.count({ where: { status: { not: "deleted" } } }),
      prisma.counselor.count({ where: { status: "active" } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "pending" } }),
      prisma.riskAssessment.count({ where: { level: { in: ["high", "crisis"] }, processStatus: { not: "closed" } } }),
      prisma.activity.count({ where: { status: "published" } }),
      prisma.schedule.count(),
      prisma.shiftApplication.count({ where: { status: "pending" } }),
      prisma.referral.count({ where: { status: "pending" } }),
      prisma.systemFeedback.count({ where: { status: { in: ["pending", "processing"] } } }),
      prisma.appointment.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.appointment.groupBy({ by: ["type"], _count: { type: true } }),
      prisma.appointment.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true }
      }),
      prisma.appointment.findMany({
        take: 5,
        include: appointmentInclude(),
        orderBy: { createdAt: "desc" }
      }),
      prisma.operationLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" }
      })
    ]);
    const trendCounts = new Map();
    trendRows.forEach((item) => {
      const key = dateKey(item.createdAt);
      trendCounts.set(key, (trendCounts.get(key) || 0) + 1);
    });
    return success(res, {
      students,
      counselors,
      appointments,
      pendingAppointments: pending,
      activeRisks: risks,
      activities,
      schedules,
      pendingShifts,
      pendingReferrals,
      pendingFeedbacks,
      appointmentStatus: statusGroups.map((item) => ({ status: item.status, count: item._count.status })),
      appointmentTypes: typeGroups.map((item) => ({ type: item.type || "unknown", count: item._count.type })),
      appointmentTrend: trendDays.map((day) => {
        const key = dateKey(day);
        return { date: key, count: trendCounts.get(key) || 0 };
      }),
      recentAppointments: recentAppointments.map(safeAppointment),
      recentLogs
    });
  }));
}

module.exports = { registerAdminDashboardRoutes };
