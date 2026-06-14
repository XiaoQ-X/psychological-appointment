const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { fail } = require("../utils/response");

const sensitiveUserFields = new Set(["passwordHash", "idCardLast6"]);

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  const unsafeSecrets = new Set(["development-only-secret", "replace-with-a-long-random-secret"]);
  if (!secret || unsafeSecrets.has(secret)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be configured with a strong production secret");
    }
    return "development-only-secret";
  }
  return secret;
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

async function loadProfile(role, id) {
  if (role === "student") {
    return prisma.student.findUnique({ where: { id }, include: { campus: true } });
  }
  if (role === "counselor") {
    return prisma.counselor.findUnique({ where: { id }, include: { campus: true } });
  }
  if (role === "admin") {
    return prisma.admin.findUnique({ where: { id } });
  }
  return null;
}

function stripSecret(value) {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(stripSecret);

  return Object.entries(value).reduce((safe, [key, item]) => {
    if (sensitiveUserFields.has(key)) return safe;
    safe[key] = stripSecret(item);
    return safe;
  }, {});
}

function requireAuth(roles = []) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return fail(res, 401, "请先登录");
    }
    try {
      const payload = jwt.verify(token, jwtSecret());
      if (roles.length && !roles.includes(payload.role)) {
        return fail(res, 403, "无权访问该接口");
      }
      const profile = await loadProfile(payload.role, payload.id);
      if (!profile || profile.status === "disabled") {
        return fail(res, 401, "登录状态已失效");
      }
      req.user = { id: payload.id, role: payload.role, profile };
      next();
    } catch (error) {
      return fail(res, 401, "登录状态已失效", { name: error.name });
    }
  };
}

module.exports = { requireAuth, signToken, stripSecret, loadProfile };
