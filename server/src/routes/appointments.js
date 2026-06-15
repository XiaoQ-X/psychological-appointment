function registerAppointmentRoutes(app, dependencies) {
  const {
    prisma,
    success,
    fail,
    asyncHandler,
    requireAuth,
    required,
    safeAppointment,
    appointmentInclude,
    assertScheduleAvailable,
    assertNoActiveStudentScheduleOverlap,
    reserveScheduleForAppointment,
    releaseFutureSchedule,
    isAppointmentConflict,
    isStatusAllowed,
    createMessage,
    logOperation
  } = dependencies;

  app.post("/api/student/appointments", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const now = new Date();
    if (!req.body?.consentAccepted) {
      return fail(res, 400, "请先确认预约知情同意");
    }
    const schedule = await assertScheduleAvailable(required(req.body.scheduleId, "排班"), prisma, now);
    const appointmentNo = `AP${Date.now()}`;
    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        await assertNoActiveStudentScheduleOverlap({
          studentId: req.user.id,
          startAt: schedule.startAt,
          endAt: schedule.endAt
        }, tx);
        await reserveScheduleForAppointment(tx, schedule, now);
        return tx.appointment.create({
          data: {
            appointmentNo,
            studentId: req.user.id,
            counselorId: schedule.counselorId,
            scheduleId: schedule.id,
            campusId: schedule.campusId,
            roomId: schedule.roomId,
            type: req.body.type || "首次咨询",
            concern: required(req.body.concern, "咨询诉求"),
            contactPhone: req.body.contactPhone || req.user.profile.phone,
            consentAccepted: Boolean(req.body.consentAccepted)
          },
          include: appointmentInclude()
        });
      });
    } catch (error) {
      if (isAppointmentConflict(error)) return fail(res, 409, error.message || "该时段已不可预约");
      throw error;
    }
    await createMessage("counselor", appointment.counselorId, "新的待确认预约", `${req.user.profile.name} 提交了新的预约申请。`, "appointment", appointment.id);
    await createMessage("student", req.user.id, "预约提交成功", "你的预约已提交，等待咨询师确认。", "appointment", appointment.id);
    await logOperation(req, "appointment:create", "appointments", appointment.id, { appointmentNo });
    return success(res, safeAppointment(appointment, { hideRecord: true }), "预约提交成功");
  }));

  app.get("/api/student/appointments", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { studentId: req.user.id, status: req.query.status || undefined },
      include: appointmentInclude(),
      orderBy: { createdAt: "desc" }
    });
    return success(res, appointments.map((item) => safeAppointment(item, { hideRecord: true })));
  }));

  app.get("/api/student/appointments/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, studentId: req.user.id },
      include: appointmentInclude()
    });
    if (!appointment) return fail(res, 404, "预约不存在");
    return success(res, safeAppointment(appointment, { hideRecord: true }));
  }));

  app.post("/api/student/appointments/:id/cancel", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, studentId: req.user.id } });
    if (!existing) return fail(res, 404, "预约不存在");
    if (!isStatusAllowed(existing.status, ["pending", "confirmed"])) return fail(res, 409, "当前预约状态不可取消");
    const now = new Date();
    const appointment = await prisma.$transaction(async (tx) => {
      await releaseFutureSchedule(tx, existing.scheduleId, now);
      return tx.appointment.update({
        where: { id: existing.id },
        data: { status: "cancelled", cancelReason: req.body.reason || "学生取消预约" },
        include: appointmentInclude()
      });
    });
    await createMessage("counselor", appointment.counselorId, "预约已取消", `${req.user.profile.name} 取消了一条预约。`, "appointment", appointment.id);
    await logOperation(req, "appointment:cancel", "appointments", appointment.id, { reason: req.body.reason });
    return success(res, safeAppointment(appointment, { hideRecord: true }), "预约已取消");
  }));

  app.post("/api/student/appointments/:id/reschedule", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, studentId: req.user.id } });
    if (!existing) return fail(res, 404, "预约不存在");
    if (!isStatusAllowed(existing.status, ["pending", "confirmed"])) return fail(res, 409, "当前预约状态不可改期");
    const now = new Date();
    const newSchedule = await assertScheduleAvailable(required(req.body.newScheduleId, "新排班"), prisma, now);
    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        await assertNoActiveStudentScheduleOverlap({
          studentId: req.user.id,
          startAt: newSchedule.startAt,
          endAt: newSchedule.endAt,
          ignoreAppointmentId: existing.id
        }, tx);
        await releaseFutureSchedule(tx, existing.scheduleId, now);
        await reserveScheduleForAppointment(tx, newSchedule, now);
        return tx.appointment.update({
          where: { id: existing.id },
          data: {
            counselorId: newSchedule.counselorId,
            scheduleId: newSchedule.id,
            campusId: newSchedule.campusId,
            roomId: newSchedule.roomId,
            status: "pending",
            rescheduleReason: req.body.reason || "学生申请改期"
          },
          include: appointmentInclude()
        });
      });
    } catch (error) {
      if (isAppointmentConflict(error)) return fail(res, 409, error.message || "该时段已不可预约");
      throw error;
    }
    await createMessage("counselor", appointment.counselorId, "预约改期申请", `${req.user.profile.name} 提交了改期后的预约。`, "appointment", appointment.id);
    await logOperation(req, "appointment:reschedule", "appointments", appointment.id, { newScheduleId: newSchedule.id });
    return success(res, safeAppointment(appointment, { hideRecord: true }), "改期申请已提交");
  }));

  app.post("/api/student/appointments/:id/feedback", requireAuth(["student"]), asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findFirst({ where: { id: req.params.id, studentId: req.user.id } });
    if (!appointment) return fail(res, 404, "预约不存在");
    if (appointment.status !== "completed") return fail(res, 409, "仅已完成预约可评价");
    const feedback = await prisma.feedback.upsert({
      where: { appointmentId: appointment.id },
      update: { rating: Number(req.body.rating || 5), tags: req.body.tags || [], content: req.body.content || "" },
      create: {
        appointmentId: appointment.id,
        studentId: req.user.id,
        rating: Number(req.body.rating || 5),
        tags: req.body.tags || [],
        content: req.body.content || ""
      }
    });
    await logOperation(req, "feedback:upsert", "feedbacks", feedback.id, { appointmentId: appointment.id });
    return success(res, feedback, "评价已提交");
  }));

  app.get("/api/counselor/appointments", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { counselorId: req.user.id, status: req.query.status || undefined },
      include: appointmentInclude(),
      orderBy: { createdAt: "desc" }
    });
    return success(res, appointments.map(safeAppointment));
  }));

  app.get("/api/counselor/appointments/:id", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, counselorId: req.user.id },
      include: appointmentInclude()
    });
    if (!appointment) return fail(res, 404, "预约不存在");
    return success(res, safeAppointment(appointment));
  }));

  async function updateCounselorAppointment(req, res, nextStatus, message, extraData = {}, allowedStatuses = ["pending"]) {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, counselorId: req.user.id } });
    if (!existing) return fail(res, 404, "预约不存在");
    if (!isStatusAllowed(existing.status, allowedStatuses)) return fail(res, 409, "当前预约状态不支持该操作");
    const appointment = await prisma.appointment.update({
      where: { id: existing.id },
      data: { status: nextStatus, ...extraData },
      include: appointmentInclude()
    });
    await createMessage("student", appointment.studentId, "预约状态更新", message, "appointment", appointment.id);
    await logOperation(req, `appointment:${nextStatus}`, "appointments", appointment.id, extraData);
    return success(res, safeAppointment(appointment), "预约状态已更新");
  }

  app.post("/api/counselor/appointments/:id/confirm", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    return updateCounselorAppointment(req, res, "confirmed", "你的预约已被咨询师确认，请按时到达。");
  }));

  app.post("/api/counselor/appointments/:id/reject", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, counselorId: req.user.id } });
    if (!existing) return fail(res, 404, "预约不存在");
    if (!isStatusAllowed(existing.status, ["pending"])) return fail(res, 409, "只有待确认预约可以拒绝");
    const now = new Date();
    const appointment = await prisma.$transaction(async (tx) => {
      await releaseFutureSchedule(tx, existing.scheduleId, now);
      return tx.appointment.update({
        where: { id: existing.id },
        data: { status: "rejected", rejectReason: req.body.reason || "咨询师暂时无法接待该时段" },
        include: appointmentInclude()
      });
    });
    await createMessage("student", appointment.studentId, "预约已被拒绝", `拒绝原因：${appointment.rejectReason}`, "appointment", appointment.id);
    await logOperation(req, "appointment:rejected", "appointments", appointment.id, { reason: appointment.rejectReason });
    return success(res, safeAppointment(appointment), "已拒绝预约");
  }));

  app.post("/api/counselor/appointments/:id/checkin", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    return updateCounselorAppointment(req, res, "in_progress", "你的预约已签到，咨询正在进行。", {}, ["confirmed"]);
  }));

  app.post("/api/counselor/appointments/:id/complete", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, counselorId: req.user.id } });
    if (!existing) return fail(res, 404, "预约不存在");
    if (!isStatusAllowed(existing.status, ["in_progress"])) return fail(res, 409, "只有进行中的预约可以完成");
    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: existing.id },
        data: { status: "completed", completedAt: new Date() },
        include: appointmentInclude()
      });
      await tx.appointmentRecord.upsert({
        where: { appointmentId: existing.id },
        update: {
          summary: req.body.summary || "已完成咨询。",
          intervention: req.body.intervention || "",
          riskNote: req.body.riskNote || "",
          plan: req.body.plan || ""
        },
        create: {
          appointmentId: existing.id,
          counselorId: req.user.id,
          summary: req.body.summary || "已完成咨询。",
          intervention: req.body.intervention || "",
          riskNote: req.body.riskNote || "",
          plan: req.body.plan || ""
        }
      });
      return updated;
    });
    await createMessage("student", appointment.studentId, "咨询已完成", "你的本次咨询已完成，可以进入预约详情提交评价。", "appointment", appointment.id);
    await logOperation(req, "appointment:completed", "appointments", appointment.id, { hasRecord: true });
    return success(res, safeAppointment(appointment), "咨询已完成");
  }));

  app.post("/api/counselor/appointments/:id/no-show", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
    return updateCounselorAppointment(req, res, "no_show", "咨询师已标记本次预约未到。", {}, ["confirmed", "in_progress"]);
  }));

  app.get("/api/admin/appointments", requireAuth(["admin"]), asyncHandler(async (req, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { status: req.query.status || undefined },
      include: appointmentInclude(),
      orderBy: { createdAt: "desc" }
    });
    return success(res, appointments.map(safeAppointment));
  }));
}

module.exports = { registerAppointmentRoutes };
