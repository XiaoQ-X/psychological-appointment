const path = require("path");
const dotenv = require("dotenv");
const ExcelJS = require("exceljs");
const jwt = require("jsonwebtoken");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const app = require("./app");
const prisma = require("./db");
const { jwtSecret } = require("./middleware/auth");

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function request(baseUrl, apiPath, options = {}) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const error = new Error(`${options.method || "GET"} ${apiPath} failed: ${payload.message}`);
    error.payload = payload;
    throw error;
  }
  return payload.data;
}

async function requestWithMeta(baseUrl, apiPath, options = {}) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const error = new Error(`${options.method || "GET"} ${apiPath} failed: ${payload.message}`);
    error.payload = payload;
    throw error;
  }
  return { data: payload.data, headers: response.headers };
}

function setCookieHeaders(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const value = headers.get("set-cookie");
  return value ? [value] : [];
}

function cookieHeader(headers) {
  return setCookieHeaders(headers)
    .map((item) => item.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function requestForm(baseUrl, apiPath, { token, formData } = {}) {
  const response = await fetch(`${baseUrl}${apiPath}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const error = new Error(`POST ${apiPath} failed: ${payload.message}`);
    error.payload = payload;
    throw error;
  }
  return payload.data;
}

async function expectRequestFailure(baseUrl, apiPath, options, expectedMessage) {
  try {
    await request(baseUrl, apiPath, options);
  } catch (error) {
    if (expectedMessage && !String(error.message).includes(expectedMessage)) {
      throw new Error(`Expected "${expectedMessage}" from ${apiPath}, got "${error.message}"`);
    }
    return error.payload;
  }
  throw new Error(`${options.method || "GET"} ${apiPath} should have failed.`);
}

async function expectFailureCode(baseUrl, apiPath, options, expectedCode) {
  const payload = await expectRequestFailure(baseUrl, apiPath, options);
  if (payload?.error?.code !== expectedCode) {
    throw new Error(`Expected error code "${expectedCode}" from ${apiPath}, got "${payload?.error?.code || "none"}"`);
  }
  return payload;
}

async function workbookBlob(headers, rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Import");
  worksheet.addRows([headers, ...rows]);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function formDataWithWorkbook(headers, rows, filename) {
  const formData = new FormData();
  formData.append("file", await workbookBlob(headers, rows), filename);
  return formData;
}

const testRunOffsetDays = 30 + Math.floor((Date.now() % 86400000) / 1000);

function futureIso(days, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days + testRunOffsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

async function main() {
  const databaseName = new URL(process.env.DATABASE_URL || "").pathname.replace(/^\//, "");
  if (databaseName !== "anxin_test") {
    throw new Error("API tests refuse to run outside the dedicated anxin_test database.");
  }
  const server = await listen();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const checks = [];

  try {
    await request(baseUrl, "/health");
    checks.push("health");

    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.headers.has("x-powered-by") || healthResponse.headers.get("x-content-type-options") !== "nosniff") {
      throw new Error("Security headers are not configured correctly.");
    }
    checks.push("security-headers");

    const adminLoginMeta = await requestWithMeta(baseUrl, "/api/auth/admin/login", {
      method: "POST",
      body: { username: "admin", password: "123456" }
    });
    const adminLogin = adminLoginMeta.data;
    const adminCookie = cookieHeader(adminLoginMeta.headers);
    if (!adminCookie.includes("anxin_refresh") || "refreshToken" in adminLogin) {
      throw new Error("Admin login must set an HttpOnly refresh cookie without exposing it in JSON.");
    }
    checks.push("admin-login");

    const adminRefresh = await request(baseUrl, "/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: adminCookie }
    });
    if (!adminRefresh.token || adminRefresh.role !== "admin") {
      throw new Error("Admin refresh cookie did not issue a fresh access token.");
    }
    checks.push("admin-refresh-cookie");

    const dashboardBefore = await request(baseUrl, "/api/admin/dashboard", { token: adminLogin.token });
    if (typeof dashboardBefore.students !== "number" || typeof dashboardBefore.counselors !== "number") {
      throw new Error("Admin dashboard should return numeric counters.");
    }
    checks.push("admin-dashboard");

    const campuses = await request(baseUrl, "/api/admin/campuses", { token: adminLogin.token });
    if (!campuses.length || !campuses[0].rooms?.length) {
      throw new Error("Minimal seed must retain campus and counseling room configuration.");
    }
    const campus = campuses[0];
    const room = campus.rooms[0];
    checks.push("admin-campus-baseline");

    const studentTemplateResponse = await fetch(`${baseUrl}/api/admin/students/import-template`, {
      headers: { Authorization: `Bearer ${adminLogin.token}` }
    });
    if (!studentTemplateResponse.ok) throw new Error("Student import template download failed.");
    checks.push("admin-student-template");

    const counselorTemplateResponse = await fetch(`${baseUrl}/api/admin/counselors/import-template`, {
      headers: { Authorization: `Bearer ${adminLogin.token}` }
    });
    if (!counselorTemplateResponse.ok) throw new Error("Counselor import template download failed.");
    checks.push("admin-counselor-template");

    const unique = Date.now();
    const importedStudentNo = `TST${unique}`;
    const studentHeaders = ["学号", "姓名", "身份核验码", "学院", "性别", "专业", "年级", "班级", "手机号", "校区", "状态"];
    const studentImport = await requestForm(baseUrl, "/api/admin/students/import", {
      token: adminLogin.token,
      formData: await formDataWithWorkbook(
        studentHeaders,
        [[importedStudentNo, "导入学生", "987654", "测试学院", "女", "心理学", "大一", "测试班", "13999990001", campus.name, "active"]],
        "students.xlsx"
      )
    });
    if (studentImport.imported !== 1) throw new Error("Student import did not create exactly one account.");
    const importedStudentPassword = studentImport.credentials?.[0]?.temporaryPassword;
    if (!importedStudentPassword || importedStudentPassword === "987654") {
      throw new Error("Student import did not return a random temporary password.");
    }
    checks.push("admin-student-import");

    let duplicateStudentFailed = false;
    try {
      await requestForm(baseUrl, "/api/admin/students/import", {
        token: adminLogin.token,
        formData: await formDataWithWorkbook(
          studentHeaders,
          [[importedStudentNo, "重复学生", "111111", "测试学院", "女", "心理学", "大一", "测试班", "13999990002", campus.name, "active"]],
          "students-duplicate.xlsx"
        )
      });
    } catch (error) {
      duplicateStudentFailed = Boolean(error.payload?.error?.errors?.length);
    }
    if (!duplicateStudentFailed) throw new Error("Duplicate student import should fail with row errors.");
    const studentAfterDuplicate = await request(baseUrl, "/api/admin/students", { token: adminLogin.token });
    if (studentAfterDuplicate.filter((item) => item.studentNo === importedStudentNo).length !== 1) {
      throw new Error("Duplicate student import wrote partial data.");
    }
    checks.push("admin-student-import-duplicate-fails");

    const importedCounselorNo = `CT${unique}`;
    const counselorHeaders = ["工号", "姓名", "身份核验码", "擅长领域", "简介", "性别", "职称", "手机号", "校区", "状态"];
    const counselorImport = await requestForm(baseUrl, "/api/admin/counselors/import", {
      token: adminLogin.token,
      formData: await formDataWithWorkbook(
        counselorHeaders,
        [[importedCounselorNo, "导入咨询师", "876543", "情绪调节、人际关系", "测试导入咨询师简介。", "男", "讲师", "13999991001", campus.name, "active"]],
        "counselors.xlsx"
      )
    });
    if (counselorImport.imported !== 1) throw new Error("Counselor import did not create exactly one account.");
    const importedCounselorPassword = counselorImport.credentials?.[0]?.temporaryPassword;
    if (!importedCounselorPassword || importedCounselorPassword === "876543") {
      throw new Error("Counselor import did not return a random temporary password.");
    }
    checks.push("admin-counselor-import");

    let duplicateCounselorFailed = false;
    try {
      await requestForm(baseUrl, "/api/admin/counselors/import", {
        token: adminLogin.token,
        formData: await formDataWithWorkbook(
          counselorHeaders,
          [[importedCounselorNo, "重复咨询师", "222222", "情绪调节", "重复测试。", "男", "讲师", "13999991002", campus.name, "active"]],
          "counselors-duplicate.xlsx"
        )
      });
    } catch (error) {
      duplicateCounselorFailed = Boolean(error.payload?.error?.errors?.length);
    }
    if (!duplicateCounselorFailed) throw new Error("Duplicate counselor import should fail with row errors.");
    const counselorAfterDuplicate = await request(baseUrl, "/api/admin/counselors", { token: adminLogin.token });
    if (counselorAfterDuplicate.filter((item) => item.jobNo === importedCounselorNo).length !== 1) {
      throw new Error("Duplicate counselor import wrote partial data.");
    }
    checks.push("admin-counselor-import-duplicate-fails");

    const importedStudent = studentAfterDuplicate.find((item) => item.studentNo === importedStudentNo);
    const importedCounselor = counselorAfterDuplicate.find((item) => item.jobNo === importedCounselorNo);
    if (!importedStudent || !importedCounselor) throw new Error("Imported accounts are not visible in admin lists.");
    if ("idCardLast6" in importedStudent || "idCardLast6" in importedCounselor) {
      throw new Error("Admin account responses must not expose identity-card suffixes.");
    }

    const studentReset = await request(baseUrl, `/api/admin/students/${importedStudent.id}/reset-password`, { method: "POST", token: adminLogin.token });
    const counselorReset = await request(baseUrl, `/api/admin/counselors/${importedCounselor.id}/reset-password`, { method: "POST", token: adminLogin.token });
    const studentTemporaryPassword = studentReset.temporaryPassword;
    const counselorTemporaryPassword = counselorReset.temporaryPassword;
    if (
      !studentTemporaryPassword ||
      !counselorTemporaryPassword ||
      studentTemporaryPassword === importedStudentPassword ||
      counselorTemporaryPassword === importedCounselorPassword
    ) {
      throw new Error("Password reset must issue a new random temporary password.");
    }
    checks.push("admin-reset-passwords");

    const studentLoginMeta = await requestWithMeta(baseUrl, "/api/auth/student/login", {
      method: "POST",
      body: { studentNo: importedStudentNo, password: studentTemporaryPassword, policyAccepted: true }
    });
    const studentLogin = studentLoginMeta.data;
    const studentCookie = cookieHeader(studentLoginMeta.headers);
    if (!studentLogin.token || !studentLogin.mustChangePassword) {
      throw new Error("Imported student must be forced to change the temporary password.");
    }
    if (!studentCookie.includes("anxin_refresh") || "refreshToken" in studentLogin) {
      throw new Error("Student login must set an HttpOnly refresh cookie without exposing it in JSON.");
    }
    checks.push("student-first-login-requires-password-change");

    const counselorLoginMeta = await requestWithMeta(baseUrl, "/api/auth/counselor/login", {
      method: "POST",
      body: { jobNo: importedCounselorNo, password: counselorTemporaryPassword }
    });
    const counselorLogin = counselorLoginMeta.data;
    const counselorCookie = cookieHeader(counselorLoginMeta.headers);
    if (!counselorLogin.token || !counselorLogin.mustChangePassword) {
      throw new Error("Imported counselor must be forced to change the temporary password.");
    }
    if (!counselorCookie.includes("anxin_refresh") || "refreshToken" in counselorLogin) {
      throw new Error("Counselor login must set an HttpOnly refresh cookie without exposing it in JSON.");
    }
    checks.push("counselor-first-login-requires-password-change");

    await expectRequestFailure(baseUrl, "/api/student/schedules", {
      token: studentLogin.token
    }, "首次登录必须先修改密码");
    checks.push("student-business-blocked-before-password-change");

    await expectRequestFailure(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: studentLogin.token,
      body: { oldPassword: "Wrong!Password9", newPassword: "Student!Secure9" }
    }, "旧密码错误");
    checks.push("student-old-password-rejected");

    await expectRequestFailure(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: studentLogin.token,
      body: { oldPassword: studentTemporaryPassword, newPassword: "12345678" }
    }, "不能为纯数字");
    checks.push("student-numeric-password-rejected");

    await expectRequestFailure(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: studentLogin.token,
      body: { oldPassword: studentTemporaryPassword, newPassword: "password123" }
    }, "过于简单");
    checks.push("student-weak-password-rejected");

    await expectRequestFailure(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: studentLogin.token,
      body: { oldPassword: studentTemporaryPassword, newPassword: studentTemporaryPassword }
    }, "不能与旧密码相同");
    checks.push("student-same-password-rejected");

    const uniqueSuffix = String(unique).slice(-6);
    const studentNewPassword = `Student!${uniqueSuffix}`;
    const counselorNewPassword = `Counselor!${uniqueSuffix}`;
    const studentPasswordChangeMeta = await requestWithMeta(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: studentLogin.token,
      body: { oldPassword: studentTemporaryPassword, newPassword: studentNewPassword }
    });
    const studentPasswordChange = studentPasswordChangeMeta.data;
    const studentChangedCookie = cookieHeader(studentPasswordChangeMeta.headers);
    const counselorPasswordChangeMeta = await requestWithMeta(baseUrl, "/api/auth/change-password", {
      method: "POST",
      token: counselorLogin.token,
      body: { oldPassword: counselorTemporaryPassword, newPassword: counselorNewPassword }
    });
    const counselorPasswordChange = counselorPasswordChangeMeta.data;
    const counselorChangedCookie = cookieHeader(counselorPasswordChangeMeta.headers);
    if (
      studentPasswordChange.mustChangePassword ||
      studentPasswordChange.user?.mustChangePassword ||
      counselorPasswordChange.mustChangePassword ||
      counselorPasswordChange.user?.mustChangePassword
    ) {
      throw new Error("Password-change flags were not cleared.");
    }
    if (!studentPasswordChange.token || !counselorPasswordChange.token) {
      throw new Error("Password change must return a refreshed token with the new session version.");
    }
    checks.push("student-and-counselor-password-change");

    await expectFailureCode(baseUrl, "/api/auth/me", { token: studentLogin.token }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/auth/me", { token: counselorLogin.token }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: studentCookie } }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: counselorCookie } }, "SESSION_REVOKED");
    const studentRefreshAfterChange = await request(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: studentChangedCookie } });
    const counselorRefreshAfterChange = await request(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: counselorChangedCookie } });
    if (!studentRefreshAfterChange.token || !counselorRefreshAfterChange.token) {
      throw new Error("Password change must rotate refresh cookies.");
    }
    checks.push("self-password-change-revokes-old-tokens");

    await expectRequestFailure(baseUrl, "/api/auth/student/login", {
      method: "POST",
      body: { studentNo: importedStudentNo, password: studentTemporaryPassword, policyAccepted: true }
    }, "账号或密码错误");
    checks.push("temporary-password-invalidated");

    const studentReloginMeta = await requestWithMeta(baseUrl, "/api/auth/student/login", {
      method: "POST",
      body: { studentNo: importedStudentNo, password: studentNewPassword, policyAccepted: true }
    });
    const studentRelogin = studentReloginMeta.data;
    const studentReloginCookie = cookieHeader(studentReloginMeta.headers);
    const counselorReloginMeta = await requestWithMeta(baseUrl, "/api/auth/counselor/login", {
      method: "POST",
      body: { jobNo: importedCounselorNo, password: counselorNewPassword }
    });
    const counselorRelogin = counselorReloginMeta.data;
    const counselorReloginCookie = cookieHeader(counselorReloginMeta.headers);
    if (studentRelogin.mustChangePassword || counselorRelogin.mustChangePassword) {
      throw new Error("Password-change state returned after successful re-login.");
    }
    checks.push("password-change-relogin");

    const expiredStudentToken = jwt.sign(
      { id: studentRelogin.user.id, role: "student", sessionVersion: studentRelogin.user.sessionVersion, type: "access" },
      jwtSecret(),
      { expiresIn: -1 }
    );
    await expectFailureCode(baseUrl, "/api/auth/me", { token: expiredStudentToken }, "TOKEN_EXPIRED");
    const refreshedStudent = await request(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: studentReloginCookie } });
    if (!refreshedStudent.token || refreshedStudent.role !== "student") {
      throw new Error("Refresh cookie did not restore an expired student access token.");
    }
    checks.push("expired-access-token-refresh");

    const schedule = await request(baseUrl, "/api/admin/schedules", {
      method: "POST",
      token: adminLogin.token,
      body: {
        counselorId: importedCounselor.id,
        roomId: room.id,
        startAt: futureIso(2, 9),
        endAt: futureIso(2, 9, 50)
      }
    });
    checks.push("admin-create-schedule");

    const schedules = await request(baseUrl, "/api/student/schedules", { token: studentRelogin.token });
    const availableSchedule = schedules.find((item) => item.id === schedule.id);
    if (!availableSchedule) throw new Error("Imported student cannot see newly created counselor schedule.");
    checks.push("student-schedules");

    const recommendation = await request(baseUrl, "/api/student/recommendations", {
      method: "POST",
      token: studentRelogin.token,
      body: {
        answers: [
          { group: "咨询诉求", selected: ["情绪压力"] },
          { group: "偏好校区", selected: [campus.name] },
          { group: "可接受时间", selected: ["周一至周五白天"] }
        ]
      }
    });
    if (!recommendation.id || !Array.isArray(recommendation.recommendedCounselors)) {
      throw new Error("Recommendation result was not saved correctly.");
    }
    checks.push("student-recommendation-create");

    const latestRecommendation = await request(baseUrl, "/api/student/recommendations/latest", { token: studentRelogin.token });
    if (!latestRecommendation || latestRecommendation.id !== recommendation.id) {
      throw new Error("Latest recommendation result is not the newly created record.");
    }
    checks.push("student-recommendation-latest");

    const created = await request(baseUrl, "/api/student/appointments", {
      method: "POST",
      token: studentRelogin.token,
      body: {
        scheduleId: availableSchedule.id,
        type: "首次咨询",
        concern: "API自测创建的预约",
        consentAccepted: true
      }
    });
    checks.push("student-create-appointment");

    const counselorAppointments = await request(baseUrl, "/api/counselor/appointments", { token: counselorRelogin.token });
    if (!counselorAppointments.some((item) => item.id === created.id)) {
      throw new Error("Counselor cannot see newly created appointment.");
    }
    checks.push("counselor-see-appointment");

    await request(baseUrl, `/api/counselor/appointments/${created.id}/confirm`, { method: "POST", token: counselorRelogin.token });
    await request(baseUrl, `/api/counselor/appointments/${created.id}/checkin`, { method: "POST", token: counselorRelogin.token });
    await request(baseUrl, `/api/counselor/appointments/${created.id}/complete`, {
      method: "POST",
      token: counselorRelogin.token,
      body: {
        summary: "API自测完成咨询记录",
        intervention: "支持性倾听",
        riskNote: "未发现急性风险",
        plan: "建议后续复访"
      }
    });
    checks.push("counselor-complete-appointment");

    const updated = await request(baseUrl, `/api/student/appointments/${created.id}`, { token: studentRelogin.token });
    if (updated.status !== "completed") throw new Error(`Expected completed, got ${updated.status}`);
    checks.push("student-status-sync");

    await request(baseUrl, `/api/student/appointments/${created.id}/feedback`, {
      method: "POST",
      token: studentRelogin.token,
      body: { rating: 5, tags: ["自测"], content: "API自测评价" }
    });
    checks.push("student-feedback");

    const cancelSchedule = await request(baseUrl, "/api/admin/schedules", {
      method: "POST",
      token: adminLogin.token,
      body: {
        counselorId: importedCounselor.id,
        roomId: room.id,
        startAt: futureIso(3, 14),
        endAt: futureIso(3, 14, 50)
      }
    });
    const cancellableAppointment = await request(baseUrl, "/api/student/appointments", {
      method: "POST",
      token: studentRelogin.token,
      body: {
        scheduleId: cancelSchedule.id,
        type: "常规咨询",
        concern: "API自测取消预约",
        consentAccepted: true
      }
    });
    await request(baseUrl, `/api/student/appointments/${cancellableAppointment.id}/cancel`, {
      method: "POST",
      token: studentRelogin.token,
      body: { reason: "API自测主动取消" }
    });
    const cancelledAppointment = await request(baseUrl, `/api/student/appointments/${cancellableAppointment.id}`, {
      token: studentRelogin.token
    });
    const releasedSchedules = await request(baseUrl, "/api/student/schedules", { token: studentRelogin.token });
    if (
      cancelledAppointment.status !== "cancelled" ||
      !releasedSchedules.some((item) => item.id === cancelSchedule.id && item.status === "available")
    ) {
      throw new Error("Student cancellation did not release the future schedule.");
    }
    checks.push("student-cancel-appointment");

    const risk = await request(baseUrl, "/api/student/risk-assessments", {
      method: "POST",
      token: studentRelogin.token,
      body: { score: 18, answers: [{ question: 1, value: 3 }] }
    });
    if (risk.level !== "high") throw new Error(`Expected high risk, got ${risk.level}`);
    checks.push("student-risk");

    const adminAppointments = await request(baseUrl, "/api/admin/appointments", { token: adminLogin.token });
    if (!adminAppointments.some((item) => item.id === created.id && item.status === "completed")) {
      throw new Error("Admin cannot see completed appointment.");
    }
    checks.push("admin-see-appointment");

    const dashboardAfter = await request(baseUrl, "/api/admin/dashboard", { token: adminLogin.token });
    if (
      dashboardAfter.appointments < 2 ||
      !dashboardAfter.appointmentStatus?.some((item) => item.status === "completed" && item.count >= 1) ||
      !dashboardAfter.appointmentStatus?.some((item) => item.status === "cancelled" && item.count >= 1) ||
      !dashboardAfter.appointmentTypes?.some((item) => item.count >= 1) ||
      !dashboardAfter.appointmentTrend?.length ||
      !dashboardAfter.recentAppointments?.some((item) => item.id === created.id)
    ) {
      throw new Error("Admin dashboard aggregation does not reflect runtime appointment data.");
    }
    checks.push("admin-dashboard-aggregation");

    const logs = await request(baseUrl, "/api/admin/logs", { token: adminLogin.token });
    if (!logs.length) throw new Error("No operation logs found after runtime operations.");
    checks.push("operation-logs");

    const secondStudentReset = await request(baseUrl, `/api/admin/students/${importedStudent.id}/reset-password`, { method: "POST", token: adminLogin.token });
    const secondCounselorReset = await request(baseUrl, `/api/admin/counselors/${importedCounselor.id}/reset-password`, { method: "POST", token: adminLogin.token });
    if (!secondStudentReset.temporaryPassword || !secondCounselorReset.temporaryPassword) {
      throw new Error("Second password reset did not return temporary passwords.");
    }
    await expectFailureCode(baseUrl, "/api/student/schedules", { token: studentRelogin.token }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/counselor/appointments", { token: counselorRelogin.token }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: studentReloginCookie } }, "SESSION_REVOKED");
    await expectFailureCode(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: counselorReloginCookie } }, "SESSION_REVOKED");
    checks.push("admin-reset-revokes-old-tokens");

    const logoutMeta = await requestWithMeta(baseUrl, "/api/auth/logout", { method: "POST", headers: { Cookie: adminCookie } });
    if (!setCookieHeaders(logoutMeta.headers).some((item) => item.includes("anxin_refresh=") && (item.includes("Max-Age=0") || item.includes("Expires=Thu, 01 Jan 1970")))) {
      throw new Error("Logout must clear the refresh cookie.");
    }
    await expectFailureCode(baseUrl, "/api/auth/refresh", { method: "POST", headers: { Cookie: "" } }, "REFRESH_TOKEN_MISSING");
    checks.push("logout-clears-refresh-cookie");

    console.log(JSON.stringify({ success: true, checks }, null, 2));
  } finally {
    await prisma.$disconnect();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
