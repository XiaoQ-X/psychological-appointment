const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs/promises");
const { randomUUID } = require("crypto");
const prisma = require("./db");
const { success, fail, asyncHandler } = require("./utils/response");
const { requireAuth, signToken, signRefreshToken, stripSecret, loadProfile, jwtSecret } = require("./middleware/auth");
const { generateTemporaryPassword, passwordPolicyError } = require("./utils/password");
const { registerAuthRoutes } = require("./routes/auth");
const { registerAdminDashboardRoutes } = require("./routes/admin-dashboard");
const { registerAppointmentRoutes } = require("./routes/appointments");
const {
  ACTIVE_APPOINTMENT_STATUSES,
  toDate,
  riskLevelForScore,
  logOperation,
  createMessage,
  appointmentInclude,
  appointmentConflictError,
  availableScheduleWhere,
  assertScheduleAvailable,
  assertNoActiveStudentScheduleOverlap,
  assertValidScheduleRange,
  ensureNoScheduleConflict
} = require("./utils/business");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const uploadRoot = path.resolve(__dirname, "../..", process.env.UPLOAD_DIR || "uploads");
const avatarUploadDir = path.join(uploadRoot, "avatars");
const refreshCookieName = process.env.REFRESH_COOKIE_NAME || "anxin_refresh";

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

function isLoopbackOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch (error) {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.length) return callback(null, corsOrigins.includes(origin) || (!isProduction && isLoopbackOrigin(origin)));
    return callback(null, !isProduction);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(isProduction ? "combined" : "dev"));
app.use("/uploads", express.static(uploadRoot));

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : isProduction,
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

function parseCookies(header = "") {
  return String(header || "").split(";").reduce((cookies, pair) => {
    const index = pair.indexOf("=");
    if (index < 0) return cookies;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(value);
      } catch (error) {
        cookies[key] = value;
      }
    }
    return cookies;
  }, {});
}

function setRefreshCookie(res, user) {
  res.cookie(refreshCookieName, signRefreshToken(user), refreshCookieOptions());
}

function clearRefreshCookie(res) {
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(refreshCookieName, options);
}

function readRefreshToken(req) {
  return parseCookies(req.headers.cookie || "")[refreshCookieName];
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler(req, res) {
    return fail(res, 429, "登录尝试过于频繁，请稍后再试");
  }
});

const allowedImportExtensions = new Set([".xlsx"]);
const allowedImportMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "application/zip"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();
    if (!allowedImportExtensions.has(ext) || (mime && !allowedImportMimeTypes.has(mime))) {
      const error = new Error("Only .xlsx import files are allowed");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});

const maxUploadMb = Math.max(Number(process.env.MAX_UPLOAD_MB || 5), 1);
const maxUploadBytes = maxUploadMb * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes }
});

app.get("/health", (req, res) => success(res, { status: "ok", service: "anxin-api" }));

function safeUser(user) {
  return stripSecret(user);
}

function safeAppointment(appointment, options = {}) {
  const data = stripSecret(appointment);
  if (data && options.hideRecord) delete data.record;
  return data;
}

function isAppointmentConflict(error) {
  return error?.status === 409 || error?.code === "P2002";
}

function isStatusAllowed(status, allowedStatuses) {
  return allowedStatuses.includes(status);
}

async function reserveScheduleForAppointment(tx, schedule, now = new Date()) {
  const updated = await tx.schedule.updateMany({
    where: {
      id: schedule.id,
      status: "available",
      startAt: { gt: now }
    },
    data: { status: "booked" }
  });
  if (updated.count !== 1) throw appointmentConflictError();
  const activeAppointment = await tx.appointment.findFirst({
    where: {
      scheduleId: schedule.id,
      status: { in: ACTIVE_APPOINTMENT_STATUSES }
    },
    select: { id: true }
  });
  if (activeAppointment) throw appointmentConflictError();
  await tx.appointment.updateMany({
    where: {
      scheduleId: schedule.id,
      status: { notIn: ACTIVE_APPOINTMENT_STATUSES }
    },
    data: { scheduleId: null }
  });
}

async function releaseFutureSchedule(tx, scheduleId, now = new Date()) {
  if (!scheduleId) return;
  await tx.schedule.updateMany({
    where: {
      id: scheduleId,
      status: "booked",
      startAt: { gt: now }
    },
    data: { status: "available" }
  });
}

function ownSignupPayload(signup) {
  if (!signup) return null;
  return {
    id: signup.id,
    activityId: signup.activityId,
    status: signup.status,
    name: signup.name,
    phone: signup.phone,
    remark: signup.remark,
    createdAt: signup.createdAt
  };
}

function studentActivityPayload(activity, coverMap = new Map(), studentId = null) {
  if (!activity) return activity;
  const signups = Array.isArray(activity.signups) ? activity.signups : [];
  const currentSignup = studentId
    ? signups.find((item) => item.studentId === studentId && item.status === "signed")
    : null;
  const data = stripSecret(applyDynamicCover(activity, coverMap));
  delete data.signups;
  return {
    ...data,
    signupCount: signups.filter((item) => item.status === "signed").length,
    ...(studentId ? {
      isSignedUp: Boolean(currentSignup),
      mySignup: ownSignupPayload(currentSignup)
    } : {})
  };
}

function safeSystemSetting(setting) {
  const data = stripSecret(setting);
  if (data?.key && /(secret|password|token|database|dsn|credential|private)/i.test(data.key)) {
    return { ...data, value: null, masked: true };
  }
  return data;
}

function forbidden(message) {
  const error = new Error(message);
  error.status = 403;
  return error;
}

async function getCounselorStudentIds(counselorId) {
  const rows = await prisma.appointment.findMany({
    where: { counselorId },
    distinct: ["studentId"],
    select: { studentId: true }
  });
  return rows.map((item) => item.studentId).filter(Boolean);
}

async function assertCounselorStudentAccess(counselorId, studentId) {
  const appointment = await prisma.appointment.findFirst({
    where: { counselorId, studentId },
    select: { id: true }
  });
  if (!appointment) throw forbidden("Only students related to the current counselor can be accessed");
}

async function counselorRiskAccessWhere(counselorId) {
  const [studentIds, riskMessages] = await Promise.all([
    getCounselorStudentIds(counselorId),
    prisma.message.findMany({
      where: {
        recipientRole: "counselor",
        recipientId: counselorId,
        relatedType: "risk",
        relatedId: { not: null }
      },
      select: { relatedId: true }
    })
  ]);
  const riskIds = riskMessages.map((item) => item.relatedId).filter(Boolean);
  const or = [];
  if (studentIds.length) or.push({ studentId: { in: studentIds } });
  if (riskIds.length) or.push({ id: { in: riskIds } });
  return or.length ? { OR: or } : { id: "__no_authorized_risk__" };
}

function studentProfilePayload(student) {
  if (!student) return null;
  return {
    id: student.id,
    name: student.name,
    studentNo: student.studentNo,
    gender: student.gender || "",
    phone: student.phone || "",
    college: student.college || "",
    major: student.major || "",
    grade: student.grade || "",
    className: student.className || "",
    campusId: student.campusId || null,
    campus: student.campus ? {
      id: student.campus.id,
      name: student.campus.name
    } : null,
    status: student.status,
    avatar: student.avatar || null,
    email: null,
    emergencyContact: null,
    privacyAccepted: student.privacyAccepted,
    privacyAcceptedAt: student.privacyAcceptedAt,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt
  };
}

function studentProfileUpdateData(body) {
  const allowedFields = ["phone", "gender", "major", "className"];
  const data = allowedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field] === undefined ? undefined : body[field];
    }
    return result;
  }, {});
  if (Object.prototype.hasOwnProperty.call(body, "avatar")) {
    data.avatar = normalizeStudentAvatar(body.avatar);
  }
  return data;
}

function normalizeStudentAvatar(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!text.startsWith("/uploads/avatars/") || text.includes("..") || text.includes("\\")) {
    const error = new Error("头像地址不合法，请通过头像上传接口更新");
    error.status = 400;
    throw error;
  }
  return text;
}

function avatarUploadError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function detectAvatarImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    throw avatarUploadError("头像文件内容无效，仅支持 PNG、JPEG、WEBP 图片");
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: ".png", mime: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: ".jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: ".webp", mime: "image/webp" };
  }
  throw avatarUploadError("头像文件类型不受支持，仅允许上传 PNG、JPEG、WEBP 图片");
}

function safeAvatarFilePath(fileName) {
  const target = path.resolve(avatarUploadDir, fileName);
  const root = path.resolve(avatarUploadDir);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw avatarUploadError("头像文件路径不合法");
  }
  return target;
}

async function saveAvatarFile(file, ownerType, ownerId) {
  const detected = detectAvatarImageType(file?.buffer);
  await fs.mkdir(avatarUploadDir, { recursive: true });
  const fileName = `${ownerType}-${ownerId}-${Date.now()}-${randomUUID().slice(0, 8)}${detected.extension}`;
  await fs.writeFile(safeAvatarFilePath(fileName), file.buffer);
  return `/uploads/avatars/${fileName}`;
}

async function saveStudentAvatar(file, studentId) {
  return saveAvatarFile(file, "student", studentId);
}

async function saveCounselorAvatar(file, counselorId) {
  return saveAvatarFile(file, "counselor", counselorId);
}

function counselorProfilePayload(counselor) {
  if (!counselor) return null;
  return {
    id: counselor.id,
    name: counselor.name,
    jobNo: counselor.jobNo,
    gender: counselor.gender || null,
    title: counselor.title || null,
    phone: counselor.phone || null,
    avatar: counselor.avatar || null,
    specialties: Array.isArray(counselor.specialties) ? counselor.specialties : [],
    introduction: counselor.introduction || "",
    campusId: counselor.campusId || null,
    campus: counselor.campus ? {
      id: counselor.campus.id,
      name: counselor.campus.name
    } : null,
    status: counselor.status,
    createdAt: counselor.createdAt,
    updatedAt: counselor.updatedAt
  };
}

function counselorProfileUpdateData(body) {
  const data = {};
  if (Object.prototype.hasOwnProperty.call(body, "phone")) data.phone = body.phone || null;
  if (Object.prototype.hasOwnProperty.call(body, "avatar")) data.avatar = body.avatar || null;
  if (Object.prototype.hasOwnProperty.call(body, "introduction")) data.introduction = body.introduction || "";
  if (Object.prototype.hasOwnProperty.call(body, "specialties")) {
    data.specialties = Array.isArray(body.specialties)
      ? body.specialties.map((item) => cleanCell(item)).filter(Boolean)
      : cleanCell(body.specialties).split(/[、,，;；]/).map((item) => item.trim()).filter(Boolean);
  }
  return data;
}

function required(value, name) {
  if (value === undefined || value === null || value === "") {
    const error = new Error(`${name}不能为空`);
    error.status = 400;
    throw error;
  }
  return value;
}

function normalizeAssessmentQuestions(questions) {
  const source = Array.isArray(questions)
    ? questions
    : Array.isArray(questions?.items)
      ? questions.items
      : Array.isArray(questions?.questions)
        ? questions.questions
        : [];
  return source.map((question, index) => {
    if (typeof question === "string") {
      return {
        id: String(index + 1),
        title: question,
        options: [],
        order: index + 1
      };
    }
    return {
      ...question,
      id: question.id || question.code || String(index + 1),
      title: question.title || question.question || question.text || "",
      options: Array.isArray(question.options) ? question.options : Array.isArray(question.choices) ? question.choices : [],
      order: Number(question.order || index + 1)
    };
  });
}

const assessmentStatuses = new Set(["active", "inactive", "archived"]);

function assessmentTypeFromQuestions(questions) {
  if (questions && typeof questions === "object" && !Array.isArray(questions)) {
    return cleanCell(questions.meta?.type || questions.type);
  }
  return "";
}

function validateAssessmentStatus(status) {
  const value = cleanCell(status || "active") || "active";
  if (!assessmentStatuses.has(value)) {
    const error = new Error("测评状态不合法");
    error.status = 400;
    throw error;
  }
  return value;
}

function buildAssessmentQuestionsPayload(questions, type) {
  const items = normalizeAssessmentQuestions(questions);
  if (!items.length) {
    const error = new Error("题目配置不能为空");
    error.status = 400;
    throw error;
  }
  const normalizedItems = items.map((item, index) => ({
    id: String(item.id || index + 1),
    title: cleanCell(item.title),
    options: Array.isArray(item.options) ? item.options : [],
    order: Number(item.order || index + 1)
  }));
  if (normalizedItems.some((item) => !item.title)) {
    const error = new Error("题目标题不能为空");
    error.status = 400;
    throw error;
  }
  return {
    items: normalizedItems,
    meta: {
      type: cleanCell(type) || assessmentTypeFromQuestions(questions) || "心理测评"
    }
  };
}

function mapAssessmentForAdmin(item) {
  return {
    id: item.id,
    code: item.code,
    title: item.title,
    description: item.description,
    type: assessmentTypeFromQuestions(item.questions) || "心理测评",
    status: item.status,
    questions: normalizeAssessmentQuestions(item.questions),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapAssessmentResultForAdmin(item) {
  return {
    id: item.id,
    assessmentId: item.assessmentId,
    assessmentTitle: item.assessment?.title || "",
    studentId: item.studentId,
    student: item.student ? safeUser(item.student) : null,
    score: item.score,
    level: item.level,
    summary: item.suggestion,
    suggestion: item.suggestion,
    answers: item.answers,
    createdAt: item.createdAt
  };
}

const systemFeedbackStatuses = new Set(["pending", "processing", "resolved", "closed"]);

function mapSystemFeedback(item) {
  return {
    id: item.id,
    studentId: item.studentId,
    student: item.student ? {
      id: item.student.id,
      name: item.student.name,
      studentNo: item.student.studentNo,
      college: item.student.college,
      phone: item.student.phone,
      campus: item.student.campus ? {
        id: item.student.campus.id,
        name: item.student.campus.name
      } : null
    } : null,
    type: item.type,
    content: item.content,
    contact: item.contact,
    status: item.status,
    adminReply: item.adminReply,
    handledBy: item.handledBy,
    handledAt: item.handledAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function findSystemFeedbackForAdmin(id) {
  const feedback = await prisma.systemFeedback.findUnique({
    where: { id },
    include: { student: { include: { campus: true } } }
  });
  return feedback;
}

function validateSystemFeedbackStatus(status) {
  const value = String(status || "").trim();
  if (!systemFeedbackStatuses.has(value)) {
    const error = new Error("系统反馈状态不合法");
    error.status = 400;
    throw error;
  }
  return value;
}

const studentImportHeaders = ["学号", "姓名", "身份核验码", "学院", "性别", "专业", "年级", "班级", "手机号", "校区", "状态"];
const counselorImportHeaders = ["工号", "姓名", "身份核验码", "擅长领域", "简介", "性别", "职称", "手机号", "校区", "状态"];

async function sendImportTemplate(res, sheetName, headers, sample) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.addRow(headers);
  worksheet.addRow(sample);
  worksheet.columns = headers.map(() => ({ width: 18 }));
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = encodeURIComponent(`${sheetName}导入模板.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
  return res.send(Buffer.from(buffer));
}

async function readImportRows(file) {
  if (!file) {
    const error = new Error("请上传Excel文件");
    error.status = 400;
    throw error;
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer, {
    ignoreNodes: ["dataValidations", "extLst", "picture"]
  });
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  if (worksheet.rowCount > 1001 || worksheet.columnCount > 50) {
    const error = new Error("导入文件最多支持1000条数据和50列");
    error.status = 400;
    throw error;
  }
  const headers = worksheet.getRow(1).values.slice(1).map(cleanCell);
  const rows = [];
  worksheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const row = {};
    headers.forEach((header, index) => {
      if (header) row[header] = cleanCell(excelRow.getCell(index + 1).text);
    });
    if (Object.values(row).some((value) => value)) rows.push({ rowNumber, row });
  });
  return rows;
}

function cleanCell(value) {
  return String(value ?? "").trim();
}

const HOME_CAROUSEL_SETTING_KEY = "studentHomeCarousel";

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRangeFromQuery(query = {}) {
  const range = {};
  const date = parseDate(query.date);
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    range.gte = start;
    range.lt = end;
  }
  const from = parseDate(query.from || query.startDate);
  const to = parseDate(query.to || query.endDate);
  if (from) range.gte = from;
  if (to) range.lte = to;
  const days = Number(query.days || 0);
  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    range.gte = since;
  }
  return Object.keys(range).length ? range : undefined;
}

function readStatusFilter(query = {}) {
  const value = cleanCell(query.readStatus || query.read || query.status);
  if (["unread", "false", "0"].includes(value)) return false;
  if (["read", "true", "1"].includes(value)) return true;
  return undefined;
}

function messageWhere(recipientRole, recipientId, query = {}) {
  const type = cleanCell(query.type);
  const isRead = readStatusFilter(query);
  const where = { recipientRole, recipientId };
  if (isRead !== undefined) where.isRead = isRead;
  if (type && type !== "all") {
    where.OR = [
      { type },
      { relatedType: type }
    ];
  }
  return where;
}

function normalizeHomeCarouselConfig(value) {
  const rawItems = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
  return rawItems
    .map((item, index) => {
      const type = cleanCell(item.type || item.targetType);
      const targetId = cleanCell(item.targetId || item.contentId || item.articleId || item.activityId);
      return {
        id: cleanCell(item.id) || `${type || "item"}-${targetId || index}`,
        type,
        targetId,
        title: cleanCell(item.title),
        subtitle: cleanCell(item.subtitle),
        cover: cleanCell(item.cover),
        order: Number(item.order ?? index + 1),
        enabled: item.enabled !== false
      };
    })
    .filter((item) => item.enabled && ["article", "activity"].includes(item.type) && item.targetId)
    .sort((a, b) => a.order - b.order);
}

async function getHomeCarouselConfig() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: HOME_CAROUSEL_SETTING_KEY } });
  return normalizeHomeCarouselConfig(setting?.value);
}

function activityCoverMapFromCarousel(config = []) {
  return new Map(config.filter((item) => item.type === "activity" && item.cover).map((item) => [item.targetId, item.cover]));
}

function articleCoverMapFromCarousel(config = []) {
  return new Map(config.filter((item) => item.type === "article" && item.cover).map((item) => [item.targetId, item.cover]));
}

function applyDynamicCover(item, coverMap) {
  if (!item) return item;
  return { ...item, cover: item.cover || coverMap.get(item.id) || "" };
}

function buildHomeCarouselItems(config = [], articles = [], activities = []) {
  const articleMap = new Map(articles.map((item) => [item.id, item]));
  const activityMap = new Map(activities.map((item) => [item.id, item]));
  return config.map((item) => {
    const target = item.type === "article" ? articleMap.get(item.targetId) : activityMap.get(item.targetId);
    if (!target) return null;
    return {
      key: item.id,
      id: item.targetId,
      type: item.type,
      title: item.title || target.title,
      subtitle: item.subtitle || target.category || "",
      cover: item.cover || target.cover || "",
      order: item.order,
      targetUrl: item.type === "article" ? `/pages/student/article-detail?id=${item.targetId}` : `/pages/student/activity-detail?id=${item.targetId}`
    };
  }).filter(Boolean);
}

function normalizeStatus(value) {
  const text = cleanCell(value);
  if (!text || ["启用", "正常", "已激活", "active"].includes(text)) return "active";
  if (["禁用", "停用", "disabled"].includes(text)) return "disabled";
  return text;
}

function parseSpecialties(value) {
  return cleanCell(value).split(/[、,，;；]/).map((item) => item.trim()).filter(Boolean);
}

function indexCampuses(campuses) {
  return new Map(campuses.map((campus) => [campus.name, campus.id]));
}

function addImportError(errors, rowNumber, field, message) {
  errors.push({ rowNumber, field, message });
}

function validateLast6(value) {
  return /^\d{6}$/.test(cleanCell(value));
}

function avatarForName(name) {
  return cleanCell(name).slice(0, 1) || "用";
}

function failImport(res, errors) {
  return fail(res, 400, "导入校验失败，未写入任何数据", { errors });
}

function recommendationKeywords(answers = []) {
  const expandMap = {
    情绪压力: ["情绪压力", "情绪调节", "焦虑压力", "抑郁情绪", "压力管理"],
    人际关系: ["人际关系", "人际冲突", "关系修复", "家庭沟通"],
    学业困扰: ["学业困扰", "学业压力", "考试焦虑", "生涯规划"],
    自我成长: ["自我成长", "自我探索", "自我认同", "正念训练"],
    睡眠问题: ["睡眠问题", "正念训练"],
    危机应对: ["危机应对", "危机评估", "危机干预", "转介协调"]
  };
  const selected = answers.flatMap((item) => {
    if (!item) return [];
    if (Array.isArray(item.selected)) return item.selected;
    if (typeof item.selected === "string") return [item.selected];
    if (Array.isArray(item.value)) return item.value;
    if (typeof item.value === "string") return [item.value];
    return [];
  }).filter(Boolean);
  return [...new Set(selected.flatMap((item) => expandMap[item] || [item]))];
}

function specialtyMatches(specialty, keywords) {
  const source = String(specialty || "").toLowerCase();
  return keywords.filter((keyword) => {
    const target = String(keyword || "").toLowerCase();
    return target && (source.includes(target) || target.includes(source));
  });
}

function recommendationReason({ matchedKeywords, sameCampus, hasAvailableSchedule, fallback }) {
  if (fallback) return hasAvailableSchedule ? "暂无强匹配，优先推荐本周可约咨询师" : "暂无强匹配，推荐可咨询老师";
  if (matchedKeywords.length) {
    const base = `擅长${matchedKeywords.slice(0, 2).join("、")}`;
    if (sameCampus && hasAvailableSchedule) return `${base}，同校区且本周可约`;
    if (hasAvailableSchedule) return `${base}，本周可约`;
    if (sameCampus) return `${base}，同校区`;
    return base;
  }
  return hasAvailableSchedule ? "本周可约" : "综合匹配";
}

async function buildRecommendationResult(student, answers) {
  const keywords = recommendationKeywords(answers);
  const now = new Date();
  const counselors = await prisma.counselor.findMany({
    where: { status: "active" },
    include: {
      campus: true,
      schedules: {
        where: availableScheduleWhere(now),
        orderBy: { startAt: "asc" },
        take: 1
      }
    },
    orderBy: { createdAt: "asc" }
  });
  const ranked = counselors.map((counselor, index) => {
    const specialties = Array.isArray(counselor.specialties) ? counselor.specialties : [];
    const matchedKeywords = [...new Set(specialties.flatMap((item) => specialtyMatches(item, keywords)))];
    const sameCampus = Boolean(student.campusId && counselor.campusId && student.campusId === counselor.campusId);
    const hasAvailableSchedule = Boolean(counselor.schedules?.length);
    const matchScore = Math.min(99, (matchedKeywords.length * 25) + (sameCampus ? 12 : 0) + (hasAvailableSchedule ? 15 : 0) + Math.max(0, 8 - index));
    return { counselor, matchedKeywords, sameCampus, hasAvailableSchedule, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const hasStrongMatch = ranked.some((item) => item.matchedKeywords.length);
  return ranked.slice(0, 3).map((item) => ({
    id: item.counselor.id,
    counselorId: item.counselor.id,
    name: item.counselor.name,
    title: item.counselor.title || "心理中心咨询师",
    avatar: item.counselor.avatar || "",
    specialties: Array.isArray(item.counselor.specialties) ? item.counselor.specialties : [],
    reason: recommendationReason({ ...item, fallback: !hasStrongMatch }),
    matchScore: item.matchScore
  }));
}

registerAuthRoutes(app, {
  prisma,
  success,
  fail,
  asyncHandler,
  requireAuth,
  signToken,
  stripSecret,
  loadProfile,
  jwtSecret,
  loginLimiter,
  required,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshToken,
  passwordPolicyError,
  logOperation
});

app.get("/api/student/profile", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: req.user.id },
    include: { campus: true }
  });
  if (!student) return fail(res, 404, "Student profile not found");
  return success(res, studentProfilePayload(student));
}));

app.put("/api/student/profile", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const data = studentProfileUpdateData(req.body || {});
  if (!Object.keys(data).length) {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: { campus: true }
    });
    if (!student) return fail(res, 404, "Student profile not found");
    return success(res, studentProfilePayload(student));
  }
  const student = await prisma.student.update({
    where: { id: req.user.id },
    data,
    include: { campus: true }
  });
  return success(res, studentProfilePayload(student), "Student profile updated");
}));

app.post("/api/student/profile/avatar", requireAuth(["student"]), avatarUpload.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 400, "请上传头像图片");
  const avatar = await saveStudentAvatar(req.file, req.user.id);
  const student = await prisma.student.update({
    where: { id: req.user.id },
    data: { avatar },
    include: { campus: true }
  });
  await logOperation(req, "student:avatar:update", "students", student.id, {});
  return success(res, { avatar, profile: studentProfilePayload(student) }, "头像已更新");
}));

app.get("/api/student/privacy", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const [student, setting] = await Promise.all([
    prisma.student.findUnique({ where: { id: req.user.id } }),
    prisma.systemSetting.findUnique({ where: { key: "privacyPolicy" } })
  ]);
  if (!student) return fail(res, 404, "Student profile not found");
  const policy = setting?.value || {};
  const content = typeof policy === "string"
    ? policy
    : policy.content || "\u5e73\u53f0\u9690\u79c1\u653f\u7b56\u5185\u5bb9\u7531\u5b66\u6821\u7ba1\u7406\u5458\u7ef4\u62a4\u3002";
  return success(res, {
    accepted: student.privacyAccepted,
    acceptedAt: student.privacyAcceptedAt,
    version: policy.version || policy.updatedAt || "v1",
    content,
    policy
  });
}));

app.post("/api/student/privacy/accept", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({
    where: { id: req.user.id },
    data: {
      privacyAccepted: true,
      privacyAcceptedAt: new Date()
    }
  });
  return success(res, {
    accepted: student.privacyAccepted,
    acceptedAt: student.privacyAcceptedAt,
    version: req.body?.version || "v1"
  }, "Privacy accepted");
}));

app.post("/api/student/system-feedback", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const type = String(required(req.body?.type, "feedback type")).trim();
  const content = String(required(req.body?.content, "feedback content")).trim();

  if (!type) return fail(res, 400, "Feedback type is required");
  if (!content) return fail(res, 400, "Feedback content is required");

  const contact = req.body?.contact === undefined || req.body?.contact === null
    ? null
    : String(req.body.contact).trim() || null;
  const id = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO system_feedbacks
      (id, student_id, type, content, contact, status, created_at, updated_at)
    VALUES
      (${id}, ${req.user.id}, ${type}, ${content}, ${contact}, 'pending', NOW(3), NOW(3))
  `;

  const feedbackRows = await prisma.$queryRaw`
    SELECT id, type, content, contact, status, created_at AS createdAt
    FROM system_feedbacks
    WHERE id = ${id}
    LIMIT 1
  `;

  return success(res, feedbackRows[0] || {
    id,
    type,
    content,
    contact,
    status: "pending",
    createdAt: new Date()
  }, "System feedback submitted");
}));

app.get("/api/student/home", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const carouselConfig = await getHomeCarouselConfig();
  const carouselArticleIds = carouselConfig.filter((item) => item.type === "article").map((item) => item.targetId);
  const carouselActivityIds = carouselConfig.filter((item) => item.type === "activity").map((item) => item.targetId);
  const [articles, activities, carouselArticles, carouselActivities, counselors, messages] = await Promise.all([
    prisma.article.findMany({ where: { status: "published" }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.activity.findMany({ where: { status: "published" }, orderBy: { startAt: "asc" }, take: 5, include: { signups: true } }),
    carouselArticleIds.length
      ? prisma.article.findMany({ where: { id: { in: carouselArticleIds }, status: "published" } })
      : Promise.resolve([]),
    carouselActivityIds.length
      ? prisma.activity.findMany({ where: { id: { in: carouselActivityIds }, status: "published" }, include: { signups: true } })
      : Promise.resolve([]),
    prisma.counselor.findMany({ where: { status: "active" }, include: { campus: true }, take: 6 }),
    prisma.message.findMany({ where: { recipientRole: "student", recipientId: req.user.id }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);
  const articleCoverMap = articleCoverMapFromCarousel(carouselConfig);
  const activityCoverMap = activityCoverMapFromCarousel(carouselConfig);
  const articlePool = [...articles, ...carouselArticles].map((item) => applyDynamicCover(item, articleCoverMap));
  const activityPool = [...activities, ...carouselActivities].map((item) => applyDynamicCover(item, activityCoverMap));
  return success(res, {
    notices: messages,
    articles: articles.map((item) => applyDynamicCover(item, articleCoverMap)),
    activities: activities.map((item) => studentActivityPayload(item, activityCoverMap)),
    recommendedCounselors: counselors.map(safeUser),
    carousel: buildHomeCarouselItems(carouselConfig, articlePool, activityPool)
  });
}));

app.get("/api/student/counselors", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const { campusId, keyword } = req.query;
  const counselors = await prisma.counselor.findMany({
    where: {
      status: "active",
      campusId: campusId || undefined,
      OR: keyword ? [
        { name: { contains: keyword } },
        { title: { contains: keyword } },
        { introduction: { contains: keyword } }
      ] : undefined
    },
    include: {
      campus: true,
      schedules: {
        where: availableScheduleWhere(),
        orderBy: { startAt: "asc" },
        take: 3
      }
    },
    orderBy: { createdAt: "asc" }
  });
  return success(res, counselors.map(safeUser));
}));

app.get("/api/student/counselors/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const counselor = await prisma.counselor.findUnique({
    where: { id: req.params.id },
    include: {
      campus: true,
      schedules: {
        where: availableScheduleWhere(),
        include: { room: true, campus: true },
        orderBy: { startAt: "asc" }
      }
    }
  });
  if (!counselor || counselor.status !== "active") return fail(res, 404, "咨询师不存在");
  return success(res, safeUser(counselor));
}));

app.post("/api/student/recommendations", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const answers = req.body.answers;
  if (!Array.isArray(answers)) return fail(res, 400, "推荐问卷答案格式不正确");
  const recommendedCounselors = await buildRecommendationResult(req.user.profile, answers);
  const result = await prisma.recommendationResult.create({
    data: {
      studentId: req.user.id,
      answers,
      recommendedCounselors
    }
  });
  await logOperation(req, "recommendation:create", "recommendation_results", result.id, { counselorCount: recommendedCounselors.length });
  return success(res, result, "推荐结果已保存");
}));

app.get("/api/student/recommendations/latest", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const result = await prisma.recommendationResult.findFirst({
    where: { studentId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  return success(res, result);
}));

app.get("/api/student/schedules", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const where = {
    ...availableScheduleWhere(),
    counselorId: req.query.counselorId || undefined
  };
  const schedules = await prisma.schedule.findMany({
    where,
    include: { counselor: true, campus: true, room: true },
    orderBy: { startAt: "asc" }
  });
  return success(res, schedules.map((item) => ({ ...item, counselor: safeUser(item.counselor) })));
}));

registerAppointmentRoutes(app, {
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
});

app.post("/api/student/risk-assessments", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const answers = req.body.answers || [];
  const score = Number(req.body.score ?? answers.reduce((sum, item) => sum + Number(item.value || 0), 0));
  const level = riskLevelForScore(score);
  const risk = await prisma.riskAssessment.create({
    data: { studentId: req.user.id, score, level, answers, processStatus: ["high", "crisis"].includes(level) ? "following" : "open" }
  });
  if (["high", "crisis"].includes(level)) {
    const counselors = await prisma.counselor.findMany({ where: { status: "active" }, take: 3 });
    await Promise.all(counselors.map((item) => createMessage("counselor", item.id, "风险学生提醒", `${req.user.profile.name} 的风险筛查为${level}，请关注。`, "risk", risk.id)));
    const admins = await prisma.admin.findMany({ where: { status: "active" } });
    await Promise.all(admins.map((item) => createMessage("admin", item.id, "风险预警", `${req.user.profile.name} 提交了高风险筛查结果。`, "risk", risk.id)));
  }
  await logOperation(req, "risk:create", "risk_assessments", risk.id, { level, score });
  return success(res, risk, "风险筛查已提交");
}));

app.get("/api/student/assessments", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const keyword = cleanCell(req.query.keyword);
  const type = cleanCell(req.query.type || req.query.category);
  const where = {
    status: "active",
    OR: keyword ? [
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ] : undefined
  };
  const assessments = await prisma.assessment.findMany({ where, orderBy: { createdAt: "desc" } });
  const filtered = type
    ? assessments.filter((item) => assessmentTypeFromQuestions(item.questions) === type)
    : assessments;
  return success(res, filtered.map(mapAssessmentForAdmin));
}));

app.get("/api/student/assessments/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: req.params.id, status: "active" }
  });
  if (!assessment) return fail(res, 404, "测评不存在");
  return success(res, {
    ...assessment,
    questions: normalizeAssessmentQuestions(assessment.questions)
  });
}));

app.get("/api/student/assessment-results", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const createdAt = dateRangeFromQuery(req.query);
  const where = {
    studentId: req.user.id,
    assessmentId: req.query.assessmentId || undefined,
    createdAt,
    level: req.query.level === "high" ? { in: ["high", "crisis"] } : req.query.level || undefined
  };
  const [items, total] = await Promise.all([
    prisma.assessmentResult.findMany({
      where,
      include: { assessment: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.assessmentResult.count({ where })
  ]);
  return success(res, {
    items: items.map((item) => ({
      id: item.id,
      assessmentId: item.assessmentId,
      assessmentTitle: item.assessment?.title || "",
      score: item.score,
      level: item.level,
      summary: item.suggestion,
      suggestion: item.suggestion,
      answers: item.answers,
      createdAt: item.createdAt
    })),
    total,
    page,
    pageSize
  });
}));

app.post("/api/student/assessment-results", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const score = Number(required(req.body.score, "分数"));
  const result = await prisma.assessmentResult.create({
    data: {
      assessmentId: required(req.body.assessmentId, "测评"),
      studentId: req.user.id,
      score,
      level: riskLevelForScore(score),
      answers: req.body.answers || [],
      suggestion: req.body.suggestion || "建议保持规律作息，如持续不适请预约心理咨询。"
    }
  });
  await logOperation(req, "assessment:create", "assessment_results", result.id, { score });
  return success(res, result, "测评结果已保存");
}));

app.get("/api/student/messages", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const messages = await prisma.message.findMany({
    where: messageWhere("student", req.user.id, req.query),
    orderBy: { createdAt: "desc" }
  });
  return success(res, messages);
}));

app.get("/api/student/messages/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const message = await prisma.message.findFirst({
    where: { id: req.params.id, recipientRole: "student", recipientId: req.user.id }
  });
  if (!message) return fail(res, 404, "消息不存在");
  return success(res, {
    id: message.id,
    type: message.type,
    title: message.title,
    content: message.content,
    relatedType: message.relatedType,
    relatedId: message.relatedId,
    isRead: message.isRead,
    createdAt: message.createdAt
  });
}));

app.post("/api/student/messages/:id/read", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const message = await prisma.message.findFirst({
    where: { id: req.params.id, recipientRole: "student", recipientId: req.user.id }
  });
  if (!message) return fail(res, 404, "消息不存在");
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { isRead: true }
  });
  return success(res, {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    content: updated.content,
    relatedType: updated.relatedType,
    relatedId: updated.relatedId,
    isRead: updated.isRead,
    createdAt: updated.createdAt
  }, "消息已读");
}));

app.get("/api/student/articles", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const carouselConfig = await getHomeCarouselConfig();
  const articleCoverMap = articleCoverMapFromCarousel(carouselConfig);
  const articles = await prisma.article.findMany({
    where: { status: "published", category: req.query.category || undefined },
    orderBy: { createdAt: "desc" }
  });
  return success(res, articles.map((item) => applyDynamicCover(item, articleCoverMap)));
}));

app.get("/api/student/articles/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const carouselConfig = await getHomeCarouselConfig();
  const articleCoverMap = articleCoverMapFromCarousel(carouselConfig);
  const article = await prisma.article.findFirst({
    where: { id: req.params.id, status: "published" },
    include: { counselor: true }
  });
  if (!article) return fail(res, 404, "文章不存在");
  return success(res, {
    ...applyDynamicCover(article, articleCoverMap),
    author: article.counselor ? safeUser(article.counselor) : null
  });
}));

app.get("/api/student/activities", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const carouselConfig = await getHomeCarouselConfig();
  const activityCoverMap = activityCoverMapFromCarousel(carouselConfig);
  const activities = await prisma.activity.findMany({
    where: { status: "published", category: req.query.category || req.query.type || undefined },
    include: { signups: true },
    orderBy: { startAt: "asc" }
  });
  return success(res, activities.map((item) => studentActivityPayload(item, activityCoverMap, req.user.id)));
}));

app.get("/api/student/activity-signups", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const status = cleanCell(req.query.status);
  const now = new Date();
  const where = {
    studentId: req.user.id
  };
  if (status === "cancelled") where.status = "cancelled";
  if (["registered", "signed"].includes(status)) {
    where.status = "signed";
    where.activity = { is: { endAt: { gte: now }, status: "published" } };
  }
  if (status === "ended") {
    where.status = "signed";
    where.activity = { is: { endAt: { lt: now } } };
  }
  const [items, total] = await Promise.all([
    prisma.activitySignup.findMany({
      where,
      include: { activity: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.activitySignup.count({ where })
  ]);
  return success(res, {
    items: items.map((item) => ({
      id: item.id,
      activityId: item.activityId,
      activityTitle: item.activity?.title || "",
      activityStartAt: item.activity?.startAt || null,
      activityEndAt: item.activity?.endAt || null,
      location: item.activity?.location || "",
      status: item.status,
      name: item.name,
      phone: item.phone,
      remark: item.remark,
      createdAt: item.createdAt,
      activity: item.activity
    })),
    total,
    page,
    pageSize
  });
}));

app.get("/api/student/activities/:id", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const carouselConfig = await getHomeCarouselConfig();
  const activityCoverMap = activityCoverMapFromCarousel(carouselConfig);
  const activity = await prisma.activity.findFirst({
    where: { id: req.params.id, status: "published" },
    include: { signups: true }
  });
  if (!activity) return fail(res, 404, "活动不存在");
  return success(res, {
    ...studentActivityPayload(activity, activityCoverMap, req.user.id),
    suitableFor: null,
    leader: null
  });
}));

app.post("/api/student/activities/:id/signup", requireAuth(["student"]), asyncHandler(async (req, res) => {
  const activity = await prisma.activity.findUnique({ where: { id: req.params.id }, include: { signups: true } });
  if (!activity || activity.status !== "published") return fail(res, 404, "活动不存在");
  if (activity.signups.filter((item) => item.status === "signed").length >= activity.capacity) return fail(res, 409, "活动名额已满");
  const signup = await prisma.activitySignup.upsert({
    where: { activityId_studentId: { activityId: activity.id, studentId: req.user.id } },
    update: { status: "signed", name: req.body.name || req.user.profile.name, phone: req.body.phone || req.user.profile.phone || "", remark: req.body.remark || "" },
    create: { activityId: activity.id, studentId: req.user.id, name: req.body.name || req.user.profile.name, phone: req.body.phone || req.user.profile.phone || "", remark: req.body.remark || "" }
  });
  await createMessage("student", req.user.id, "活动报名成功", `你已成功报名：${activity.title}`, "activity", activity.id);
  await logOperation(req, "activity:signup", "activity_signups", signup.id, { activityId: activity.id });
  return success(res, signup, "活动报名成功");
}));

app.get("/api/counselor/dashboard", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const riskAccessWhere = await counselorRiskAccessWhere(req.user.id);
  const [todayAppointments, pendingCount, riskCount, messages] = await Promise.all([
    prisma.appointment.findMany({
      where: { counselorId: req.user.id, schedule: { startAt: { gte: todayStart, lt: todayEnd } } },
      include: appointmentInclude(),
      orderBy: { createdAt: "desc" }
    }),
    prisma.appointment.count({ where: { counselorId: req.user.id, status: "pending" } }),
    prisma.riskAssessment.count({
      where: {
        AND: [
          riskAccessWhere,
          { level: { in: ["high", "crisis"] }, processStatus: { in: ["open", "following"] } }
        ]
      }
    }),
    prisma.message.findMany({ where: { recipientRole: "counselor", recipientId: req.user.id }, orderBy: { createdAt: "desc" }, take: 5 })
  ]);
  return success(res, { todayAppointments: todayAppointments.map(safeAppointment), pendingCount, riskCount, messages });
}));

app.post("/api/counselor/records", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findFirst({ where: { id: required(req.body.appointmentId, "预约"), counselorId: req.user.id } });
  if (!appointment) return fail(res, 404, "预约不存在");
  const record = await prisma.appointmentRecord.upsert({
    where: { appointmentId: appointment.id },
    update: { summary: req.body.summary || "", intervention: req.body.intervention || "", riskNote: req.body.riskNote || "", plan: req.body.plan || "" },
    create: { appointmentId: appointment.id, counselorId: req.user.id, summary: req.body.summary || "", intervention: req.body.intervention || "", riskNote: req.body.riskNote || "", plan: req.body.plan || "" }
  });
  await logOperation(req, "record:upsert", "appointment_records", record.id, { appointmentId: appointment.id });
  return success(res, record, "咨询记录已保存");
}));

app.get("/api/counselor/students", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { counselorId: req.user.id },
    distinct: ["studentId"],
    include: { student: { include: { campus: true, riskAssessments: { orderBy: { createdAt: "desc" }, take: 1 } } } }
  });
  return success(res, appointments.map((item) => safeUser(item.student)));
}));

app.get("/api/counselor/students/:id", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findFirst({ where: { counselorId: req.user.id, studentId: req.params.id } });
  if (!appointment) return fail(res, 403, "只能访问自己负责的学生档案");
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: { campus: true, appointments: { where: { counselorId: req.user.id }, include: appointmentInclude() }, riskAssessments: true, assessmentResults: true }
  });
  return success(res, safeUser(student));
}));

app.get("/api/counselor/schedules", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const startAt = dateRangeFromQuery(req.query);
  const schedules = await prisma.schedule.findMany({
    where: {
      counselorId: req.user.id,
      status: req.query.status || undefined,
      startAt
    },
    include: { campus: true, room: true, appointment: true },
    orderBy: { startAt: "asc" }
  });
  return success(res, schedules);
}));

app.get("/api/counselor/rooms", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const campusId = req.user.profile?.campusId;
  const rooms = await prisma.counselingRoom.findMany({
    where: {
      status: "active",
      ...(campusId ? { campusId } : {})
    },
    include: { campus: true },
    orderBy: { name: "asc" }
  });
  return success(res, rooms);
}));

app.post("/api/counselor/schedules", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const startAt = toDate(required(req.body.startAt, "开始时间"));
  const endAt = toDate(required(req.body.endAt, "结束时间"));
  const roomId = required(req.body.roomId, "咨询室");
  const room = await prisma.counselingRoom.findUnique({ where: { id: roomId } });
  if (!room || room.status !== "active") return fail(res, 404, "咨询室不存在");
  if (req.user.profile?.campusId && room.campusId !== req.user.profile.campusId) {
    throw forbidden("Only rooms in the current counselor campus can be used");
  }
  await ensureNoScheduleConflict({ counselorId: req.user.id, roomId, startAt, endAt });
  const schedule = await prisma.schedule.create({
    data: {
      counselorId: req.user.id,
      campusId: room.campusId,
      roomId,
      startAt,
      endAt,
      source: "counselor"
    },
    include: { campus: true, room: true }
  });
  await logOperation(req, "schedule:create", "schedules", schedule.id, { startAt, endAt });
  return success(res, schedule, "排班已新增");
}));

app.post("/api/counselor/shift-applications", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  let schedule = null;
  if (req.body.scheduleId) {
    schedule = await prisma.schedule.findFirst({
      where: { id: req.body.scheduleId, counselorId: req.user.id },
      select: { id: true, roomId: true, startAt: true, endAt: true }
    });
    if (!schedule) throw forbidden("Only current counselor schedules can be adjusted");
  }
  const toStartAt = toDate(required(req.body.toStartAt, "调整后开始时间"));
  const toEndAt = toDate(required(req.body.toEndAt, "调整后结束时间"));
  if (schedule) {
    await ensureNoScheduleConflict({
      counselorId: req.user.id,
      roomId: schedule.roomId,
      startAt: toStartAt,
      endAt: toEndAt,
      ignoreId: schedule.id
    });
  } else {
    assertValidScheduleRange(toStartAt, toEndAt);
  }
  const application = await prisma.shiftApplication.create({
    data: {
      counselorId: req.user.id,
      scheduleId: req.body.scheduleId || null,
      fromStartAt: req.body.fromStartAt ? toDate(req.body.fromStartAt) : null,
      fromEndAt: req.body.fromEndAt ? toDate(req.body.fromEndAt) : null,
      toStartAt,
      toEndAt,
      reason: required(req.body.reason, "调班原因")
    }
  });
  const admins = await prisma.admin.findMany({ where: { status: "active" } });
  await Promise.all(admins.map((item) => createMessage("admin", item.id, "调班审批待处理", `${req.user.profile.name} 提交了调班申请。`, "shift", application.id)));
  await logOperation(req, "shift:create", "shift_applications", application.id, {});
  return success(res, application, "调班申请已提交");
}));

app.get("/api/counselor/risk-records", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const accessWhere = await counselorRiskAccessWhere(req.user.id);
  const filters = {};
  if (req.query.level) filters.level = req.query.level;
  if (req.query.status) filters.processStatus = req.query.status;
  const createdAt = dateRangeFromQuery(req.query);
  if (createdAt) filters.createdAt = createdAt;
  const records = await prisma.riskAssessment.findMany({
    where: {
      AND: [
        accessWhere,
        filters
      ]
    },
    include: { student: { include: { campus: true } } },
    orderBy: { createdAt: "desc" }
  });
  return success(res, records.map((item) => ({ ...item, student: safeUser(item.student) })));
}));

app.post("/api/counselor/risk-feedback", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const accessWhere = await counselorRiskAccessWhere(req.user.id);
  const existing = await prisma.riskAssessment.findFirst({
    where: {
      id: required(req.body.riskAssessmentId, "风险记录"),
      AND: [accessWhere]
    },
    select: { id: true }
  });
  if (!existing) throw forbidden("Only authorized risk records can be updated");
  const risk = await prisma.riskAssessment.update({
    where: { id: existing.id },
    data: { feedback: required(req.body.feedback, "处理反馈"), processStatus: "following" },
    include: { student: true }
  });
  await logOperation(req, "risk:feedback", "risk_assessments", risk.id, {});
  return success(res, { ...risk, student: safeUser(risk.student) }, "风险处理反馈已提交");
}));

app.get("/api/counselor/referrals", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const scope = cleanCell(req.query.scope);
  const baseWhere = scope === "sent"
    ? { sourceCounselorId: req.user.id }
    : scope === "received"
      ? { targetCounselorId: req.user.id }
      : scope === "pending"
        ? { targetCounselorId: req.user.id, status: "pending" }
        : { OR: [{ sourceCounselorId: req.user.id }, { targetCounselorId: req.user.id }] };
  const referrals = await prisma.referral.findMany({
    where: {
      ...baseWhere,
      status: req.query.status || baseWhere.status
    },
    include: { student: true, sourceCounselor: true, targetCounselor: true },
    orderBy: { createdAt: "desc" }
  });
  return success(res, referrals.map((item) => ({
    ...item,
    student: safeUser(item.student),
    sourceCounselor: safeUser(item.sourceCounselor),
    targetCounselor: safeUser(item.targetCounselor)
  })));
}));

app.get("/api/counselor/referrals/:id", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const referral = await prisma.referral.findFirst({
    where: {
      id: req.params.id,
      OR: [{ sourceCounselorId: req.user.id }, { targetCounselorId: req.user.id }]
    },
    include: { student: true, sourceCounselor: true, targetCounselor: true }
  });
  if (!referral) return fail(res, 404, "转介记录不存在");
  return success(res, {
    ...referral,
    student: safeUser(referral.student),
    sourceCounselor: safeUser(referral.sourceCounselor),
    targetCounselor: safeUser(referral.targetCounselor),
    appointment: null,
    handledAt: referral.status === "pending" ? null : referral.updatedAt,
    handledNote: referral.rejectReason || referral.adminNote || ""
  });
}));

app.get("/api/counselor/available-counselors", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const counselors = await prisma.counselor.findMany({
    where: { status: "active", id: { not: req.user.id } },
    include: { campus: true },
    orderBy: { name: "asc" }
  });
  return success(res, counselors.map(safeUser));
}));

app.post("/api/counselor/referrals", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const studentId = required(req.body.studentId, "学生");
  const targetCounselorId = required(req.body.targetCounselorId, "目标咨询师");
  await assertCounselorStudentAccess(req.user.id, studentId);
  if (targetCounselorId === req.user.id) throw forbidden("Target counselor must be different from current counselor");
  const targetCounselor = await prisma.counselor.findFirst({
    where: { id: targetCounselorId, status: "active" },
    select: { id: true }
  });
  if (!targetCounselor) return fail(res, 404, "目标咨询师不存在");
  const referral = await prisma.referral.create({
    data: {
      studentId,
      sourceCounselorId: req.user.id,
      targetCounselorId,
      reason: required(req.body.reason, "转介原因")
    }
  });
  await createMessage("counselor", referral.targetCounselorId, "新的转介申请", `${req.user.profile.name} 发起了转介申请。`, "referral", referral.id);
  await logOperation(req, "referral:create", "referrals", referral.id, {});
  return success(res, referral, "转介申请已提交");
}));

app.post("/api/counselor/referrals/:id/accept", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const referral = await prisma.referral.updateMany({ where: { id: req.params.id, targetCounselorId: req.user.id }, data: { status: "accepted" } });
  if (!referral.count) return fail(res, 404, "转介记录不存在");
  await logOperation(req, "referral:accepted", "referrals", req.params.id, {});
  return success(res, { id: req.params.id }, "已接受转介");
}));

app.post("/api/counselor/referrals/:id/reject", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const referral = await prisma.referral.updateMany({
    where: { id: req.params.id, targetCounselorId: req.user.id },
    data: { status: "rejected", rejectReason: req.body.reason || "目标咨询师拒绝转介" }
  });
  if (!referral.count) return fail(res, 404, "转介记录不存在");
  await logOperation(req, "referral:rejected", "referrals", req.params.id, { reason: req.body.reason });
  return success(res, { id: req.params.id }, "已拒绝转介");
}));

app.get("/api/counselor/messages", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const messages = await prisma.message.findMany({ where: messageWhere("counselor", req.user.id, req.query), orderBy: { createdAt: "desc" } });
  return success(res, messages);
}));

app.get("/api/counselor/messages/:id", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const message = await prisma.message.findFirst({
    where: { id: req.params.id, recipientRole: "counselor", recipientId: req.user.id }
  });
  if (!message) return fail(res, 404, "消息不存在");
  return success(res, {
    id: message.id,
    type: message.type,
    title: message.title,
    content: message.content,
    relatedType: message.relatedType,
    relatedId: message.relatedId,
    isRead: message.isRead,
    createdAt: message.createdAt
  });
}));

app.post("/api/counselor/messages/:id/read", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const message = await prisma.message.findFirst({
    where: { id: req.params.id, recipientRole: "counselor", recipientId: req.user.id }
  });
  if (!message) return fail(res, 404, "消息不存在");
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { isRead: true }
  });
  return success(res, {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    content: updated.content,
    relatedType: updated.relatedType,
    relatedId: updated.relatedId,
    isRead: updated.isRead,
    createdAt: updated.createdAt
  }, "消息已读");
}));

app.get("/api/counselor/profile", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const counselor = await prisma.counselor.findUnique({
    where: { id: req.user.id },
    include: { campus: true }
  });
  if (!counselor) return fail(res, 404, "咨询师资料不存在");
  return success(res, counselorProfilePayload(counselor));
}));

app.put("/api/counselor/profile", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const data = counselorProfileUpdateData(req.body || {});
  if (!Object.keys(data).length) {
    const counselor = await prisma.counselor.findUnique({
      where: { id: req.user.id },
      include: { campus: true }
    });
    if (!counselor) return fail(res, 404, "咨询师资料不存在");
    return success(res, counselorProfilePayload(counselor));
  }
  const counselor = await prisma.counselor.update({
    where: { id: req.user.id },
    data,
    include: { campus: true }
  });
  return success(res, counselorProfilePayload(counselor), "咨询师资料已更新");
}));

app.post("/api/counselor/profile/avatar", requireAuth(["counselor"]), avatarUpload.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) return fail(res, 400, "请上传头像图片");
  const avatar = await saveCounselorAvatar(req.file, req.user.id);
  const counselor = await prisma.counselor.update({
    where: { id: req.user.id },
    data: { avatar },
    include: { campus: true }
  });
  await logOperation(req, "counselor:avatar:update", "counselors", counselor.id, {});
  return success(res, { avatar, profile: counselorProfilePayload(counselor) }, "头像已更新");
}));

app.get("/api/counselor/articles", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const articles = await prisma.article.findMany({ where: { counselorId: req.user.id }, orderBy: { createdAt: "desc" } });
  return success(res, articles);
}));

app.post("/api/counselor/articles", requireAuth(["counselor"]), asyncHandler(async (req, res) => {
  const article = await prisma.article.create({
    data: {
      title: required(req.body.title, "标题"),
      category: req.body.category || "心理科普",
      summary: req.body.summary || "",
      content: req.body.content || "",
      cover: req.body.cover || "",
      authorRole: "counselor",
      authorId: req.user.id,
      counselorId: req.user.id,
      status: req.body.status || "published"
    }
  });
  await logOperation(req, "article:create", "articles", article.id, { status: article.status });
  return success(res, article, "文章已发布");
}));

registerAdminDashboardRoutes(app, {
  prisma,
  success,
  asyncHandler,
  requireAuth,
  appointmentInclude,
  safeAppointment
});

app.get("/api/admin/students/import-template", requireAuth(["admin"]), asyncHandler(async (req, res) => (
  sendImportTemplate(res, "学生账号", studentImportHeaders, ["学号必填", "姓名必填", "6位身份核验码", "学院必填", "性别选填", "专业选填", "年级选填", "班级选填", "手机号选填", "校区选填", "active/disabled"])
)));

app.get("/api/admin/counselors/import-template", requireAuth(["admin"]), asyncHandler(async (req, res) => (
  sendImportTemplate(res, "咨询师账号", counselorImportHeaders, ["工号必填", "姓名必填", "6位身份核验码", "擅长领域必填", "简介必填", "性别选填", "职称选填", "手机号选填", "校区选填", "active/disabled"])
)));

app.post("/api/admin/students/import", requireAuth(["admin"]), upload.single("file"), asyncHandler(async (req, res) => {
  const rows = await readImportRows(req.file);
  const errors = [];
  const campuses = await prisma.campus.findMany();
  const campusMap = indexCampuses(campuses);
  const seen = new Set();
  const studentNos = [];
  const normalized = rows.map(({ rowNumber, row }) => {
    const item = {
      rowNumber,
      studentNo: cleanCell(row["学号"]),
      name: cleanCell(row["姓名"]),
      idCardLast6: cleanCell(row["身份核验码"] || row["身份证后六位"]),
      college: cleanCell(row["学院"]),
      gender: cleanCell(row["性别"]),
      major: cleanCell(row["专业"]),
      grade: cleanCell(row["年级"]),
      className: cleanCell(row["班级"]),
      phone: cleanCell(row["手机号"]),
      campusName: cleanCell(row["校区"]),
      status: normalizeStatus(row["状态"])
    };
    if (!item.studentNo) addImportError(errors, rowNumber, "学号", "学号不能为空");
    if (!item.name) addImportError(errors, rowNumber, "姓名", "姓名不能为空");
    if (!validateLast6(item.idCardLast6)) addImportError(errors, rowNumber, "身份核验码", "身份核验码必须为6位数字");
    if (!item.college) addImportError(errors, rowNumber, "学院", "学院不能为空");
    if (item.campusName && !campusMap.has(item.campusName)) addImportError(errors, rowNumber, "校区", "校区必须匹配系统已有校区");
    if (item.studentNo) {
      if (seen.has(item.studentNo)) addImportError(errors, rowNumber, "学号", "文件内学号重复");
      seen.add(item.studentNo);
      studentNos.push(item.studentNo);
    }
    return item;
  });
  const existing = await prisma.student.findMany({ where: { studentNo: { in: studentNos }, status: { not: "deleted" } }, select: { studentNo: true } });
  const existingSet = new Set(existing.map((item) => item.studentNo));
  normalized.forEach((item) => {
    if (existingSet.has(item.studentNo)) addImportError(errors, item.rowNumber, "学号", "学号已存在");
  });
  if (errors.length) return failImport(res, errors);

  const result = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const item of normalized) {
      const temporaryPassword = generateTemporaryPassword();
      const student = await tx.student.create({
        data: {
          studentNo: item.studentNo,
          name: item.name,
          gender: item.gender,
          idCardLast6: item.idCardLast6,
          passwordHash: await bcrypt.hash(temporaryPassword, 12),
          mustChangePassword: true,
          college: item.college,
          major: item.major,
          grade: item.grade,
          className: item.className,
          phone: item.phone,
          campusId: item.campusName ? campusMap.get(item.campusName) : null,
          status: item.status
        }
      });
      created.push({ student, temporaryPassword });
    }
    return created;
  });
  const log = await logOperation(req, "student:import", "students", null, { count: result.length });
  return success(res, {
    imported: result.length,
    successRows: result.length,
    operationLogId: log.id,
    credentials: result.map(({ student, temporaryPassword }) => ({
      account: student.studentNo,
      name: student.name,
      temporaryPassword
    }))
  }, "学生账号导入成功");
}));

app.post("/api/admin/counselors/import", requireAuth(["admin"]), upload.single("file"), asyncHandler(async (req, res) => {
  const rows = await readImportRows(req.file);
  const errors = [];
  const campuses = await prisma.campus.findMany();
  const campusMap = indexCampuses(campuses);
  const seen = new Set();
  const jobNos = [];
  const normalized = rows.map(({ rowNumber, row }) => {
    const item = {
      rowNumber,
      jobNo: cleanCell(row["工号"]),
      name: cleanCell(row["姓名"]),
      idCardLast6: cleanCell(row["身份核验码"] || row["身份证后六位"]),
      specialties: parseSpecialties(row["擅长领域"]),
      introduction: cleanCell(row["简介"]),
      gender: cleanCell(row["性别"]),
      title: cleanCell(row["职称"]),
      phone: cleanCell(row["手机号"]),
      campusName: cleanCell(row["校区"]),
      status: normalizeStatus(row["状态"])
    };
    if (!item.jobNo) addImportError(errors, rowNumber, "工号", "工号不能为空");
    if (!item.name) addImportError(errors, rowNumber, "姓名", "姓名不能为空");
    if (!validateLast6(item.idCardLast6)) addImportError(errors, rowNumber, "身份核验码", "身份核验码必须为6位数字");
    if (!item.specialties.length) addImportError(errors, rowNumber, "擅长领域", "擅长领域不能为空");
    if (!item.introduction) addImportError(errors, rowNumber, "简介", "简介不能为空");
    if (item.campusName && !campusMap.has(item.campusName)) addImportError(errors, rowNumber, "校区", "校区必须匹配系统已有校区");
    if (item.jobNo) {
      if (seen.has(item.jobNo)) addImportError(errors, rowNumber, "工号", "文件内工号重复");
      seen.add(item.jobNo);
      jobNos.push(item.jobNo);
    }
    return item;
  });
  const existing = await prisma.counselor.findMany({ where: { jobNo: { in: jobNos }, status: { not: "deleted" } }, select: { jobNo: true } });
  const existingSet = new Set(existing.map((item) => item.jobNo));
  normalized.forEach((item) => {
    if (existingSet.has(item.jobNo)) addImportError(errors, item.rowNumber, "工号", "工号已存在");
  });
  if (errors.length) return failImport(res, errors);

  const result = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const item of normalized) {
      const temporaryPassword = generateTemporaryPassword();
      const counselor = await tx.counselor.create({
        data: {
          jobNo: item.jobNo,
          name: item.name,
          gender: item.gender,
          idCardLast6: item.idCardLast6,
          passwordHash: await bcrypt.hash(temporaryPassword, 12),
          mustChangePassword: true,
          title: item.title || "心理咨询师",
          phone: item.phone,
          campusId: item.campusName ? campusMap.get(item.campusName) : null,
          specialties: item.specialties,
          introduction: item.introduction,
          status: item.status
        }
      });
      created.push({ counselor, temporaryPassword });
    }
    return created;
  });
  const log = await logOperation(req, "counselor:import", "counselors", null, { count: result.length });
  return success(res, {
    imported: result.length,
    successRows: result.length,
    operationLogId: log.id,
    credentials: result.map(({ counselor, temporaryPassword }) => ({
      account: counselor.jobNo,
      name: counselor.name,
      temporaryPassword
    }))
  }, "咨询师账号导入成功");
}));

app.get("/api/admin/students", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const keyword = cleanCell(req.query.keyword);
  const students = await prisma.student.findMany({
    where: {
      status: req.query.status || { not: "deleted" },
      OR: keyword ? [
        { name: { contains: keyword } },
        { studentNo: { contains: keyword } },
        { college: { contains: keyword } }
      ] : undefined
    },
    include: { campus: true },
    orderBy: { createdAt: "desc" }
  });
  return success(res, students.map(safeUser));
}));

app.get("/api/admin/students/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.params.id }, include: { campus: true, appointments: true, riskAssessments: true } });
  if (!student) return fail(res, 404, "学生不存在");
  return success(res, safeUser(student));
}));

app.post("/api/admin/students", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const idCardLast6 = cleanCell(req.body.idCardLast6);
  if (!validateLast6(idCardLast6)) return fail(res, 400, "身份核验码必须为6位数字");
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const student = await prisma.student.create({
    data: {
      studentNo: required(req.body.studentNo, "学号"),
      name: required(req.body.name, "姓名"),
      gender: req.body.gender || "",
      idCardLast6,
      passwordHash,
      mustChangePassword: true,
      college: req.body.college || "未设置学院",
      major: req.body.major || "",
      grade: req.body.grade || "",
      className: req.body.className || "",
      phone: req.body.phone || "",
      campusId: req.body.campusId || null,
      privacyAccepted: Boolean(req.body.privacyAccepted)
    }
  });
  await logOperation(req, "student:create", "students", student.id, {});
  return success(res, { user: safeUser(student), temporaryPassword }, "学生已新增");
}));

app.put("/api/admin/students/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      gender: req.body.gender,
      college: req.body.college,
      major: req.body.major,
      grade: req.body.grade,
      className: req.body.className,
      phone: req.body.phone,
      campusId: req.body.campusId,
      status: req.body.status
    }
  });
  await logOperation(req, "student:update", "students", student.id, {});
  return success(res, safeUser(student), "学生已更新");
}));

app.delete("/api/admin/students/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const student = await prisma.student.update({ where: { id: req.params.id }, data: { status: "deleted" } });
  await logOperation(req, "student:delete", "students", student.id, {});
  return success(res, safeUser(student), "学生已删除");
}));

app.post("/api/admin/students/:id/reset-password", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const existing = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.status === "deleted") return fail(res, 404, "学生不存在");
  const temporaryPassword = generateTemporaryPassword();
  const student = await prisma.student.update({
    where: { id: existing.id },
    data: {
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      mustChangePassword: true,
      sessionVersion: { increment: 1 }
    }
  });
  await logOperation(req, "student:reset-password", "students", student.id, {});
  return success(res, { user: safeUser(student), temporaryPassword }, "学生密码已重置");
}));

app.get("/api/admin/counselors", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const keyword = cleanCell(req.query.keyword);
  const counselors = await prisma.counselor.findMany({
    where: {
      status: req.query.status || { not: "deleted" },
      OR: keyword ? [
        { name: { contains: keyword } },
        { jobNo: { contains: keyword } },
        { title: { contains: keyword } },
        { introduction: { contains: keyword } }
      ] : undefined
    },
    include: { campus: true, schedules: true, appointments: true },
    orderBy: { createdAt: "desc" }
  });
  return success(res, counselors.map(safeUser));
}));

app.get("/api/admin/counselors/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const counselor = await prisma.counselor.findUnique({ where: { id: req.params.id }, include: { campus: true, schedules: true, appointments: true } });
  if (!counselor) return fail(res, 404, "咨询师不存在");
  return success(res, safeUser(counselor));
}));

app.post("/api/admin/counselors", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const idCardLast6 = cleanCell(req.body.idCardLast6);
  if (!validateLast6(idCardLast6)) return fail(res, 400, "身份核验码必须为6位数字");
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const counselor = await prisma.counselor.create({
    data: {
      jobNo: required(req.body.jobNo, "工号"),
      name: required(req.body.name, "姓名"),
      gender: req.body.gender || "",
      idCardLast6,
      passwordHash,
      mustChangePassword: true,
      title: req.body.title || "心理咨询师",
      phone: req.body.phone || "",
      campusId: req.body.campusId || null,
      specialties: req.body.specialties || [],
      introduction: req.body.introduction || "暂无简介"
    }
  });
  await logOperation(req, "counselor:create", "counselors", counselor.id, {});
  return success(res, { user: safeUser(counselor), temporaryPassword }, "咨询师已新增");
}));

app.put("/api/admin/counselors/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const counselor = await prisma.counselor.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      gender: req.body.gender,
      title: req.body.title,
      phone: req.body.phone,
      campusId: req.body.campusId,
      specialties: req.body.specialties,
      introduction: req.body.introduction,
      status: req.body.status
    }
  });
  await logOperation(req, "counselor:update", "counselors", counselor.id, {});
  return success(res, safeUser(counselor), "咨询师已更新");
}));

app.post("/api/admin/counselors/:id/disable", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const counselor = await prisma.counselor.update({ where: { id: req.params.id }, data: { status: "disabled" } });
  await logOperation(req, "counselor:disable", "counselors", counselor.id, {});
  return success(res, safeUser(counselor), "咨询师已禁用");
}));

app.post("/api/admin/counselors/:id/reset-password", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const existing = await prisma.counselor.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.status === "deleted") return fail(res, 404, "咨询师不存在");
  const temporaryPassword = generateTemporaryPassword();
  const counselor = await prisma.counselor.update({
    where: { id: existing.id },
    data: {
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      mustChangePassword: true,
      sessionVersion: { increment: 1 }
    }
  });
  await logOperation(req, "counselor:reset-password", "counselors", counselor.id, {});
  return success(res, { user: safeUser(counselor), temporaryPassword }, "咨询师密码已重置");
}));

app.get("/api/admin/schedules", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const schedules = await prisma.schedule.findMany({ include: { counselor: true, campus: true, room: true, appointment: true }, orderBy: { startAt: "asc" } });
  return success(res, schedules.map((item) => ({ ...item, counselor: safeUser(item.counselor) })));
}));

app.post("/api/admin/schedules", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const startAt = toDate(required(req.body.startAt, "开始时间"));
  const endAt = toDate(required(req.body.endAt, "结束时间"));
  const counselorId = required(req.body.counselorId, "咨询师");
  const roomId = required(req.body.roomId, "咨询室");
  const room = await prisma.counselingRoom.findUnique({ where: { id: roomId } });
  if (!room) return fail(res, 404, "咨询室不存在");
  await ensureNoScheduleConflict({ counselorId, roomId, startAt, endAt });
  const schedule = await prisma.schedule.create({ data: { counselorId, roomId, campusId: room.campusId, startAt, endAt, source: "admin" } });
  await logOperation(req, "schedule:create", "schedules", schedule.id, {});
  return success(res, schedule, "排班已新增");
}));

app.put("/api/admin/schedules/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const current = await prisma.schedule.findUnique({ where: { id: req.params.id } });
  if (!current) return fail(res, 404, "排班不存在");
  const startAt = req.body.startAt ? toDate(req.body.startAt) : current.startAt;
  const endAt = req.body.endAt ? toDate(req.body.endAt) : current.endAt;
  const counselorId = req.body.counselorId || current.counselorId;
  const roomId = req.body.roomId || current.roomId;
  await ensureNoScheduleConflict({ counselorId, roomId, startAt, endAt, ignoreId: current.id });
  const room = await prisma.counselingRoom.findUnique({ where: { id: roomId } });
  const schedule = await prisma.schedule.update({ where: { id: current.id }, data: { counselorId, roomId, campusId: room.campusId, startAt, endAt, status: req.body.status } });
  await logOperation(req, "schedule:update", "schedules", schedule.id, {});
  return success(res, schedule, "排班已更新");
}));

app.delete("/api/admin/schedules/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const schedule = await prisma.schedule.update({ where: { id: req.params.id }, data: { status: "disabled" } });
  await logOperation(req, "schedule:disable", "schedules", schedule.id, {});
  return success(res, schedule, "排班已禁用");
}));

app.get("/api/admin/shift-applications", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const shifts = await prisma.shiftApplication.findMany({ include: { counselor: true }, orderBy: { createdAt: "desc" } });
  return success(res, shifts.map((item) => ({ ...item, counselor: safeUser(item.counselor) })));
}));

app.post("/api/admin/shift-applications/:id/approve", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const shift = await prisma.shiftApplication.update({
    where: { id: req.params.id },
    data: { status: "approved", adminNote: req.body.note || "审批通过" },
    select: {
      id: true,
      counselorId: true,
      scheduleId: true,
      fromStartAt: true,
      fromEndAt: true,
      toStartAt: true,
      toEndAt: true,
      reason: true,
      status: true,
      adminNote: true,
      createdAt: true,
      updatedAt: true,
      counselor: {
        select: {
          id: true,
          name: true,
          jobNo: true,
          title: true,
          phone: true,
          campusId: true,
          status: true
        }
      }
    }
  });
  if (shift.scheduleId) {
    await prisma.schedule.update({ where: { id: shift.scheduleId }, data: { startAt: shift.toStartAt, endAt: shift.toEndAt } });
  }
  await createMessage("counselor", shift.counselorId, "调班申请已通过", "管理员已通过你的调班申请。", "shift", shift.id);
  await logOperation(req, "shift:approve", "shift_applications", shift.id, {});
  return success(res, shift, "调班申请已通过");
}));

app.post("/api/admin/shift-applications/:id/reject", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const shift = await prisma.shiftApplication.update({ where: { id: req.params.id }, data: { status: "rejected", adminNote: req.body.note || "审批驳回" } });
  await createMessage("counselor", shift.counselorId, "调班申请已驳回", shift.adminNote || "管理员已驳回你的调班申请。", "shift", shift.id);
  await logOperation(req, "shift:reject", "shift_applications", shift.id, {});
  return success(res, shift, "调班申请已驳回");
}));

app.get("/api/admin/risk-records", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const records = await prisma.riskAssessment.findMany({ include: { student: { include: { campus: true } } }, orderBy: { createdAt: "desc" } });
  return success(res, records.map((item) => ({ ...item, student: safeUser(item.student) })));
}));

app.post("/api/admin/risk-records/:id/followup", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const risk = await prisma.riskAssessment.update({ where: { id: req.params.id }, data: { followupNotes: req.body.note || "", processStatus: "following" }, include: { student: true } });
  await logOperation(req, "risk:followup", "risk_assessments", risk.id, {});
  return success(res, { ...risk, student: safeUser(risk.student) }, "跟进记录已保存");
}));

app.post("/api/admin/risk-records/:id/close", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const risk = await prisma.riskAssessment.update({ where: { id: req.params.id }, data: { processStatus: "closed", closedAt: new Date(), followupNotes: req.body.note || undefined } });
  await logOperation(req, "risk:close", "risk_assessments", risk.id, {});
  return success(res, risk, "风险记录已结案");
}));

app.get("/api/admin/referrals", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const referrals = await prisma.referral.findMany({ include: { student: true, sourceCounselor: true, targetCounselor: true }, orderBy: { createdAt: "desc" } });
  return success(res, referrals.map((item) => ({ ...item, student: safeUser(item.student), sourceCounselor: safeUser(item.sourceCounselor), targetCounselor: safeUser(item.targetCounselor) })));
}));

app.post("/api/admin/referrals/:id/approve", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const referral = await prisma.referral.update({ where: { id: req.params.id }, data: { status: "approved", adminNote: req.body.note || "管理员审批通过" } });
  await logOperation(req, "referral:approve", "referrals", referral.id, {});
  return success(res, referral, "转介已审批通过");
}));

app.post("/api/admin/referrals/:id/reject", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const referral = await prisma.referral.update({ where: { id: req.params.id }, data: { status: "rejected", adminNote: req.body.note || "管理员审批驳回" } });
  await logOperation(req, "referral:reject", "referrals", referral.id, {});
  return success(res, referral, "转介已驳回");
}));

app.get("/api/admin/system-feedbacks", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const where = {};
  if (req.query.status) where.status = validateSystemFeedbackStatus(req.query.status);
  if (req.query.type) where.type = String(req.query.type).trim();
  const [items, total] = await Promise.all([
    prisma.systemFeedback.findMany({
      where,
      include: { student: { include: { campus: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.systemFeedback.count({ where })
  ]);
  return success(res, {
    items: items.map(mapSystemFeedback),
    total,
    page,
    pageSize
  });
}));

app.get("/api/admin/system-feedbacks/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const feedback = await findSystemFeedbackForAdmin(req.params.id);
  if (!feedback) return fail(res, 404, "系统反馈不存在");
  return success(res, mapSystemFeedback(feedback));
}));

app.put("/api/admin/system-feedbacks/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const status = validateSystemFeedbackStatus(required(req.body.status, "处理状态"));
  const existing = await findSystemFeedbackForAdmin(req.params.id);
  if (!existing) return fail(res, 404, "系统反馈不存在");
  const data = { status };
  if (["processing", "resolved", "closed"].includes(status)) {
    data.handledBy = req.user.id;
    data.handledAt = new Date();
  }
  const feedback = await prisma.systemFeedback.update({
    where: { id: req.params.id },
    data,
    include: { student: { include: { campus: true } } }
  });
  await logOperation(req, "system_feedback:update", "system_feedbacks", feedback.id, { status });
  return success(res, mapSystemFeedback(feedback), "系统反馈状态已更新");
}));

app.post("/api/admin/system-feedbacks/:id/reply", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const adminReply = String(required(req.body.adminReply, "回复内容")).trim();
  if (!adminReply) return fail(res, 400, "回复内容不能为空");
  const existing = await findSystemFeedbackForAdmin(req.params.id);
  if (!existing) return fail(res, 404, "系统反馈不存在");
  const feedback = await prisma.systemFeedback.update({
    where: { id: req.params.id },
    data: {
      adminReply,
      status: "resolved",
      handledBy: req.user.id,
      handledAt: new Date()
    },
    include: { student: { include: { campus: true } } }
  });
  await logOperation(req, "system_feedback:reply", "system_feedbacks", feedback.id, {});
  return success(res, mapSystemFeedback(feedback), "系统反馈回复已保存");
}));

app.post("/api/admin/system-feedbacks/:id/close", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const existing = await findSystemFeedbackForAdmin(req.params.id);
  if (!existing) return fail(res, 404, "系统反馈不存在");
  const feedback = await prisma.systemFeedback.update({
    where: { id: req.params.id },
    data: {
      status: "closed",
      handledBy: req.user.id,
      handledAt: new Date()
    },
    include: { student: { include: { campus: true } } }
  });
  await logOperation(req, "system_feedback:close", "system_feedbacks", feedback.id, {});
  return success(res, mapSystemFeedback(feedback), "系统反馈已关闭");
}));

app.get("/api/admin/assessments", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const keyword = cleanCell(req.query.keyword);
  const where = {};
  if (req.query.status) where.status = validateAssessmentStatus(req.query.status);
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { description: { contains: keyword } }
    ];
  }
  const [items, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.assessment.count({ where })
  ]);
  return success(res, {
    items: items.map(mapAssessmentForAdmin),
    total,
    page,
    pageSize
  });
}));

app.get("/api/admin/assessments/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!assessment) return fail(res, 404, "测评不存在");
  return success(res, mapAssessmentForAdmin(assessment));
}));

app.post("/api/admin/assessments", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const title = required(cleanCell(req.body.title), "测评标题");
  const assessment = await prisma.assessment.create({
    data: {
      code: cleanCell(req.body.code) || `assessment-${Date.now()}-${randomUUID().slice(0, 8)}`,
      title,
      description: req.body.description || "",
      status: validateAssessmentStatus(req.body.status),
      questions: buildAssessmentQuestionsPayload(req.body.questions, req.body.type)
    }
  });
  await logOperation(req, "assessment:create", "assessments", assessment.id, {});
  return success(res, mapAssessmentForAdmin(assessment), "测评已新增");
}));

app.put("/api/admin/assessments/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const existing = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 404, "测评不存在");
  const data = {};
  if (Object.prototype.hasOwnProperty.call(req.body, "title")) data.title = required(cleanCell(req.body.title), "测评标题");
  if (Object.prototype.hasOwnProperty.call(req.body, "description")) data.description = req.body.description || "";
  if (Object.prototype.hasOwnProperty.call(req.body, "status")) data.status = validateAssessmentStatus(req.body.status);
  if (Object.prototype.hasOwnProperty.call(req.body, "questions") || Object.prototype.hasOwnProperty.call(req.body, "type")) {
    data.questions = buildAssessmentQuestionsPayload(
      Object.prototype.hasOwnProperty.call(req.body, "questions") ? req.body.questions : existing.questions,
      Object.prototype.hasOwnProperty.call(req.body, "type") ? req.body.type : assessmentTypeFromQuestions(existing.questions)
    );
  }
  const assessment = await prisma.assessment.update({ where: { id: existing.id }, data });
  await logOperation(req, "assessment:update", "assessments", assessment.id, {});
  return success(res, mapAssessmentForAdmin(assessment), "测评已更新");
}));

app.delete("/api/admin/assessments/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const existing = await prisma.assessment.findUnique({ where: { id: req.params.id } });
  if (!existing) return fail(res, 404, "测评不存在");
  const assessment = await prisma.assessment.update({ where: { id: existing.id }, data: { status: "archived" } });
  await logOperation(req, "assessment:archive", "assessments", assessment.id, {});
  return success(res, mapAssessmentForAdmin(assessment), "测评已归档");
}));

app.get("/api/admin/assessment-results", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const where = {
    assessmentId: req.query.assessmentId || undefined
  };
  const [items, total] = await Promise.all([
    prisma.assessmentResult.findMany({
      where,
      include: { assessment: true, student: { include: { campus: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.assessmentResult.count({ where })
  ]);
  return success(res, {
    items: items.map(mapAssessmentResultForAdmin),
    total,
    page,
    pageSize
  });
}));

app.get("/api/admin/articles", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const keyword = cleanCell(req.query.keyword);
  const articles = await prisma.article.findMany({
    where: {
      status: req.query.status || undefined,
      category: req.query.category || undefined,
      OR: keyword ? [
        { title: { contains: keyword } },
        { summary: { contains: keyword } }
      ] : undefined
    },
    orderBy: { createdAt: "desc" }
  });
  return success(res, articles);
}));

app.post("/api/admin/articles", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const article = await prisma.article.create({
    data: {
      title: required(req.body.title, "标题"),
      category: req.body.category || "心理科普",
      summary: req.body.summary || "",
      content: req.body.content || "",
      cover: req.body.cover || "",
      authorRole: "admin",
      authorId: req.user.id,
      status: req.body.status || "published"
    }
  });
  await logOperation(req, "article:create", "articles", article.id, {});
  return success(res, article, "文章已新增");
}));

app.put("/api/admin/articles/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const article = await prisma.article.update({ where: { id: req.params.id }, data: { title: req.body.title, category: req.body.category, summary: req.body.summary, content: req.body.content, cover: req.body.cover, status: req.body.status } });
  await logOperation(req, "article:update", "articles", article.id, {});
  return success(res, article, "文章已更新");
}));

app.delete("/api/admin/articles/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const article = await prisma.article.update({ where: { id: req.params.id }, data: { status: "archived" } });
  await logOperation(req, "article:archive", "articles", article.id, {});
  return success(res, article, "文章已归档");
}));

app.get("/api/admin/activities", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const keyword = cleanCell(req.query.keyword);
  const date = req.query.date ? toDate(req.query.date) : null;
  const dateRange = date
    ? {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      }
    : undefined;
  const carouselConfig = await getHomeCarouselConfig();
  const activityCoverMap = activityCoverMapFromCarousel(carouselConfig);
  const activities = await prisma.activity.findMany({
    where: {
      status: req.query.status || undefined,
      category: req.query.category || req.query.type || undefined,
      startAt: dateRange,
      OR: keyword ? [
        { title: { contains: keyword } },
        { description: { contains: keyword } }
      ] : undefined
    },
    include: { signups: { include: { student: true } } },
    orderBy: { createdAt: "desc" }
  });
  return success(res, activities.map((item) => ({
    ...applyDynamicCover(item, activityCoverMap),
    signups: item.signups.map((signup) => ({ ...signup, student: safeUser(signup.student) }))
  })));
}));

app.post("/api/admin/activities", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const activity = await prisma.activity.create({
    data: {
      title: required(req.body.title, "活动标题"),
      category: req.body.category || "讲座",
      location: req.body.location || "心理中心",
      startAt: toDate(required(req.body.startAt, "开始时间")),
      endAt: toDate(required(req.body.endAt, "结束时间")),
      signupEndAt: toDate(req.body.signupEndAt || req.body.startAt),
      capacity: Number(req.body.capacity || 30),
      description: req.body.description || "",
      status: req.body.status || "published"
    }
  });
  await logOperation(req, "activity:create", "activities", activity.id, {});
  return success(res, activity, "活动已新增");
}));

app.put("/api/admin/activities/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.startAt) data.startAt = toDate(data.startAt);
  if (data.endAt) data.endAt = toDate(data.endAt);
  if (data.signupEndAt) data.signupEndAt = toDate(data.signupEndAt);
  if (data.capacity) data.capacity = Number(data.capacity);
  const activity = await prisma.activity.update({ where: { id: req.params.id }, data });
  await logOperation(req, "activity:update", "activities", activity.id, {});
  return success(res, activity, "活动已更新");
}));

app.delete("/api/admin/activities/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const activity = await prisma.activity.update({ where: { id: req.params.id }, data: { status: "cancelled" } });
  await logOperation(req, "activity:cancel", "activities", activity.id, {});
  return success(res, activity, "活动已取消");
}));

app.get("/api/admin/campuses", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const campuses = await prisma.campus.findMany({ include: { rooms: true }, orderBy: { createdAt: "asc" } });
  return success(res, campuses);
}));

app.post("/api/admin/campuses", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const campus = await prisma.campus.create({ data: { name: required(req.body.name, "校区名称"), address: req.body.address || "", phone: req.body.phone || "" } });
  await logOperation(req, "campus:create", "campuses", campus.id, {});
  return success(res, campus, "校区已新增");
}));

app.delete("/api/admin/campuses/:id", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const campus = await prisma.campus.update({ where: { id: req.params.id }, data: { status: "disabled" } });
  await logOperation(req, "campus:disable", "campuses", campus.id, {});
  return success(res, campus, "校区已禁用");
}));

app.get("/api/admin/logs", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const logs = await prisma.operationLog.findMany({ orderBy: { createdAt: "desc" }, take: Number(req.query.limit || 100) });
  return success(res, logs);
}));

app.get("/api/admin/settings", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  return success(res, settings.map(safeSystemSetting));
}));

app.put("/api/admin/settings", requireAuth(["admin"]), asyncHandler(async (req, res) => {
  const entries = Array.isArray(req.body.settings) ? req.body.settings : Object.entries(req.body).map(([key, value]) => ({ key, value }));
  const results = [];
  for (const item of entries) {
    results.push(await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: { value: item.value, description: item.description },
      create: { key: item.key, value: item.value, description: item.description || "" }
    }));
  }
  await logOperation(req, "settings:update", "system_settings", null, { keys: entries.map((item) => item.key) });
  return success(res, results.map(safeSystemSetting), "系统设置已保存");
}));

app.use((req, res) => fail(res, 404, "接口不存在"));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) {
    const isAvatarUpload = req.path.endsWith("/profile/avatar");
    const message = error.code === "LIMIT_FILE_SIZE"
      ? (isAvatarUpload ? `头像文件不能超过 ${maxUploadMb}MB` : "上传文件不能超过 5MB")
      : "文件上传失败，请检查文件后重试";
    return fail(res, 400, message, { code: error.code });
  }
  const status = error.code === "P2002" ? 409 : error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  const message = error.code === "P2002"
    ? "数据已存在，请检查唯一字段"
    : status >= 500
      ? "服务器暂时无法处理，请稍后重试"
      : error.message || "操作失败";
  const errorPayload = status >= 500 ? { code: error.code } : { code: error.code, meta: error.meta };
  return fail(res, status, message, isProduction ? { code: error.code } : errorPayload);
});

module.exports = app;
