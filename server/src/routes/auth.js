const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function registerAuthRoutes(app, dependencies) {
  const {
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
  } = dependencies;

  const safeUser = (user) => stripSecret(user);

  async function loginWithPassword({ model, where, password, role }) {
    const user = await prisma[model].findUnique({
      where,
      include: model === "student" || model === "counselor" ? { campus: true } : undefined
    });
    if (!user || user.status === "disabled" || user.status === "deleted") {
      const error = new Error("账号不存在或已停用");
      error.status = 401;
      throw error;
    }
    const passwordOk = await bcrypt.compare(password || "", user.passwordHash);
    if (!passwordOk) {
      const error = new Error("账号或密码错误");
      error.status = 401;
      throw error;
    }
    const token = signToken({ id: user.id, role, sessionVersion: user.sessionVersion });
    return {
      token,
      refreshUser: { id: user.id, role, sessionVersion: user.sessionVersion },
      role,
      mustChangePassword: Boolean(user.mustChangePassword),
      user: safeUser(user)
    };
  }

  app.post("/api/auth/student/login", loginLimiter, asyncHandler(async (req, res) => {
    const studentNo = required(req.body.studentNo || req.body.account, "学号");
    const password = required(req.body.password, "密码");
    if (!req.body?.policyAccepted) {
      return fail(res, 400, "请先阅读并同意隐私政策和服务协议");
    }
    const data = await loginWithPassword({ model: "student", where: { studentNo }, password, role: "student" });
    await prisma.student.update({
      where: { id: data.user.id },
      data: { privacyAccepted: true, privacyAcceptedAt: new Date() }
    });
    setRefreshCookie(res, data.refreshUser);
    delete data.refreshUser;
    return success(res, data, "学生登录成功");
  }));

  app.post("/api/auth/counselor/login", loginLimiter, asyncHandler(async (req, res) => {
    const jobNo = required(req.body.jobNo || req.body.account, "工号");
    const password = required(req.body.password, "密码");
    const data = await loginWithPassword({ model: "counselor", where: { jobNo }, password, role: "counselor" });
    setRefreshCookie(res, data.refreshUser);
    delete data.refreshUser;
    return success(res, data, "咨询师登录成功");
  }));

  app.post("/api/auth/admin/login", loginLimiter, asyncHandler(async (req, res) => {
    const username = required(req.body.username || req.body.account, "用户名");
    const password = required(req.body.password, "密码");
    const data = await loginWithPassword({ model: "admin", where: { username }, password, role: "admin" });
    setRefreshCookie(res, data.refreshUser);
    delete data.refreshUser;
    return success(res, data, "管理员登录成功");
  }));

  app.get("/api/auth/me", requireAuth(["student", "counselor", "admin"], { allowPasswordChange: true }), (req, res) => {
    return success(res, {
      role: req.user.role,
      mustChangePassword: Boolean(req.user.profile.mustChangePassword),
      user: safeUser(req.user.profile)
    });
  });

  app.post("/api/auth/refresh", asyncHandler(async (req, res) => {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) return fail(res, 401, "登录状态已失效", { code: "REFRESH_TOKEN_MISSING" });

    let payload;
    try {
      payload = jwt.verify(refreshToken, jwtSecret());
    } catch (error) {
      clearRefreshCookie(res);
      return fail(res, 401, "登录状态已失效", {
        name: error.name,
        code: error.name === "TokenExpiredError" ? "REFRESH_TOKEN_EXPIRED" : "REFRESH_TOKEN_INVALID"
      });
    }
    if (payload.type !== "refresh") {
      clearRefreshCookie(res);
      return fail(res, 401, "登录状态已失效", { code: "INVALID_TOKEN_TYPE" });
    }

    const profile = await loadProfile(payload.role, payload.id);
    if (!profile || profile.status === "disabled" || profile.status === "deleted") {
      clearRefreshCookie(res);
      return fail(res, 401, "登录状态已失效", { code: "SESSION_REVOKED" });
    }
    if (Number(payload.sessionVersion || 0) !== Number(profile.sessionVersion || 1)) {
      clearRefreshCookie(res);
      return fail(res, 401, "登录状态已失效", { code: "SESSION_REVOKED" });
    }

    const token = signToken({ id: profile.id, role: payload.role, sessionVersion: profile.sessionVersion });
    setRefreshCookie(res, { id: profile.id, role: payload.role, sessionVersion: profile.sessionVersion });
    return success(res, {
      token,
      role: payload.role,
      mustChangePassword: Boolean(profile.mustChangePassword),
      user: safeUser(profile)
    });
  }));

  app.post("/api/auth/change-password", requireAuth(["student", "counselor"], { allowPasswordChange: true }), asyncHandler(async (req, res) => {
    const oldPassword = required(req.body.oldPassword, "旧密码");
    const newPassword = required(req.body.newPassword, "新密码");
    const policyError = passwordPolicyError(newPassword);
    if (policyError) return fail(res, 400, policyError);
    if (oldPassword === newPassword) return fail(res, 400, "新密码不能与旧密码相同");

    const model = req.user.role;
    const user = await prisma[model].findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(oldPassword, user.passwordHash))) {
      return fail(res, 400, "旧密码错误");
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return fail(res, 400, "新密码不能与旧密码相同");
    }

    const updated = await prisma[model].update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
        sessionVersion: { increment: 1 }
      },
      include: { campus: true }
    });
    await logOperation(req, `${req.user.role}:change-password`, `${req.user.role}s`, user.id, {});
    setRefreshCookie(res, { id: updated.id, role: req.user.role, sessionVersion: updated.sessionVersion });
    return success(res, {
      token: signToken({ id: updated.id, role: req.user.role, sessionVersion: updated.sessionVersion }),
      role: req.user.role,
      mustChangePassword: false,
      user: safeUser(updated)
    }, "密码修改成功");
  }));

  app.post("/api/auth/logout", (req, res) => {
    clearRefreshCookie(res);
    return success(res, {}, "已退出登录");
  });
}

module.exports = { registerAuthRoutes };
