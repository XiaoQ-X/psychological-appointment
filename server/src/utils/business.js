const prisma = require("../db");

const ACTIVE_APPOINTMENT_STATUSES = ["pending", "confirmed", "in_progress"];

function appointmentConflictError(message = "该时段已不可预约") {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function isActiveAppointmentStatus(status) {
  return ACTIVE_APPOINTMENT_STATUSES.includes(status);
}

function availableScheduleWhere(now = new Date()) {
  return {
    status: "available",
    startAt: { gt: now },
    OR: [
      { appointment: { is: null } },
      { appointment: { is: { status: { notIn: ACTIVE_APPOINTMENT_STATUSES } } } }
    ]
  };
}

function toDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("日期格式不正确");
  }
  return date;
}

function assertValidScheduleRange(startAt, endAt, now = new Date()) {
  if (endAt.getTime() <= startAt.getTime()) {
    const error = new Error("结束时间必须晚于开始时间");
    error.status = 400;
    throw error;
  }
  if (startAt.getTime() <= now.getTime()) {
    const error = new Error("不能创建或调整到过去时间的排班");
    error.status = 400;
    throw error;
  }
}

function riskLevelForScore(score) {
  if (score >= 20) return "crisis";
  if (score >= 15) return "high";
  if (score >= 8) return "medium";
  return "low";
}

async function logOperation(req, action, entity, entityId = null, detail = {}) {
  const actor = req.user || { role: "system", id: null };
  return prisma.operationLog.create({
    data: {
      actorRole: actor.role,
      actorId: actor.id || null,
      action,
      entity,
      entityId,
      detail,
      ip: req.ip
    }
  });
}

async function createMessage(recipientRole, recipientId, title, content, relatedType = null, relatedId = null, type = "business") {
  return prisma.message.create({
    data: { recipientRole, recipientId, title, content, relatedType, relatedId, type }
  });
}

function appointmentInclude() {
  return {
    student: { include: { campus: true } },
    counselor: { include: { campus: true } },
    schedule: true,
    campus: true,
    room: true,
    record: true,
    feedback: true
  };
}

async function assertScheduleAvailable(scheduleId, client = prisma, now = new Date()) {
  const schedule = await client.schedule.findUnique({
    where: { id: scheduleId },
    include: { counselor: true, campus: true, room: true, appointment: true }
  });
  if (!schedule) {
    const error = new Error("排班不存在");
    error.status = 404;
    throw error;
  }
  if (schedule.status !== "available") throw appointmentConflictError();
  if (new Date(schedule.startAt).getTime() <= now.getTime()) throw appointmentConflictError("该时段已过期，不能预约");
  if (schedule.appointment && isActiveAppointmentStatus(schedule.appointment.status)) throw appointmentConflictError();
  return schedule;
}

async function assertNoActiveStudentScheduleOverlap({ studentId, startAt, endAt, ignoreAppointmentId = null }, client = prisma) {
  const conflict = await client.appointment.findFirst({
    where: {
      studentId,
      id: ignoreAppointmentId ? { not: ignoreAppointmentId } : undefined,
      status: { in: ACTIVE_APPOINTMENT_STATUSES },
      schedule: {
        is: {
          startAt: { lt: endAt },
          endAt: { gt: startAt }
        }
      }
    },
    select: { id: true }
  });
  if (conflict) throw appointmentConflictError("你已有同一时段的有效预约，请先取消或改期原预约");
}

async function ensureNoScheduleConflict({ counselorId, roomId, startAt, endAt, ignoreId = null }) {
  assertValidScheduleRange(startAt, endAt);
  const conflicts = await prisma.schedule.findMany({
    where: {
      id: ignoreId ? { not: ignoreId } : undefined,
      status: { not: "disabled" },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      OR: [
        { counselorId },
        { roomId }
      ]
    }
  });
  if (conflicts.length) {
    const error = new Error("排班时间与咨询师或咨询室已有时段冲突");
    error.status = 409;
    throw error;
  }
}

module.exports = {
  ACTIVE_APPOINTMENT_STATUSES,
  toDate,
  assertValidScheduleRange,
  riskLevelForScore,
  logOperation,
  createMessage,
  appointmentInclude,
  appointmentConflictError,
  availableScheduleWhere,
  assertScheduleAvailable,
  assertNoActiveStudentScheduleOverlap,
  ensureNoScheduleConflict
};
