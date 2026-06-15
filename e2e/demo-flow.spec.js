const { test, expect } = require("@playwright/test");
const fixtures = require("./fixtures.cjs");

const urls = {
  student: "http://127.0.0.1:4273",
  counselor: "http://127.0.0.1:4274",
  admin: "http://127.0.0.1:4275",
  miniapp: "http://127.0.0.1:4276"
};

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    containers: ["body", ".admin-shell", ".admin-sidebar", ".sidebar-nav", ".admin-main", ".admin-content"]
      .map((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          selector,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          overflowX: style.overflowX
        };
      })
      .filter(Boolean),
    offenders: Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || "").slice(0, 80),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right)
        };
      })
      .filter((item) => item.width > document.documentElement.clientWidth + 1 || item.right > document.documentElement.clientWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 8),
    contentOffenders: Array.from(document.querySelectorAll(".admin-content *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || "").slice(0, 80),
          text: String(element.textContent || "").trim().slice(0, 40),
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right)
        };
      })
      .filter((item) => item.width > document.documentElement.clientWidth + 1 || item.right > document.documentElement.clientWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12)
  }));
  expect(metrics.scrollWidth, `horizontal overflow: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function expectVisibleControlsUsable(page) {
  const invalid = await page.locator("button:visible").evaluateAll((buttons) => buttons
    .filter((button) => {
      const rect = button.getBoundingClientRect();
      const style = getComputedStyle(button);
      return !button.disabled
        && style.position !== "absolute"
        && (rect.width < 44 || rect.height < 44);
    })
    .slice(0, 10)
    .map((button) => ({
      text: button.textContent.trim().slice(0, 40),
      width: Math.round(button.getBoundingClientRect().width),
      height: Math.round(button.getBoundingClientRect().height)
    })));
  expect(invalid, `touch targets below 44px: ${JSON.stringify(invalid)}`).toEqual([]);
}

async function auditViewports(page, testId) {
  for (const viewport of [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 1365, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByTestId(testId)).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectVisibleControlsUsable(page);
  }
}

async function fillByTestId(page, testId, value) {
  const field = page.getByTestId(testId);
  const nestedInput = field.locator("input, textarea").first();
  if (await nestedInput.count()) {
    await nestedInput.fill(value);
    return;
  }
  await field.fill(value);
}

async function changePassword(page, prefix, oldPassword, newPassword) {
  await fillByTestId(page, `${prefix}-old-password`, oldPassword);
  await fillByTestId(page, `${prefix}-new-password`, newPassword);
  await fillByTestId(page, `${prefix}-confirm-password`, newPassword);
  await page.getByTestId(`${prefix}-change-password-submit`).click();
}

async function createStudentAppointment(page) {
  await page.getByRole("button", { name: "预约", exact: true }).first().click();
  await expect(page.getByTestId("student-booking")).toBeVisible();
  await expect(page.getByTestId("student-counselor-card")).toContainText(fixtures.counselor.name);
  await page.getByTestId("student-book-counselor").first().click();
  await page.locator("textarea[placeholder*='困扰']").fill("E2E 测试预约：近期学习压力较大，希望获得支持。");
  await page.locator(".booking-consent input[type='checkbox']").check();
  await page.getByRole("button", { name: "提交预约申请" }).click();
  await page.getByTestId("student-confirm-booking").click();
  await expect(page.getByTestId("student-booking-success")).toBeVisible();
  await page.getByRole("button", { name: "查看我的预约" }).click();
  await expect(page.getByTestId("student-appointment-card").first()).toBeVisible();
}

test.describe.serial("core browser demo flow", () => {
  test("student changes password, creates, views and cancels an appointment", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(urls.student);
    await page.getByTestId("student-account").fill(fixtures.student.account);
    await page.getByTestId("student-password").fill(fixtures.student.temporaryPassword);
    await page.locator(".prototype-checkline input[type='checkbox']").check();
    await page.getByTestId("student-login-submit").click();
    await expect(page.getByTestId("student-change-password-form")).toBeVisible();
    await changePassword(page, "student", fixtures.student.temporaryPassword, fixtures.student.newPassword);
    await expect(page.getByTestId("student-home")).toBeVisible();
    await auditViewports(page, "student-home");

    await page.setViewportSize({ width: 390, height: 844 });
    await createStudentAppointment(page);
    await page.getByTestId("student-cancel-appointment").first().click();
    await page.getByTestId("student-confirm-cancel").click();
    await expect(page.getByTestId("student-appointment-card").first()).toContainText("已取消");

    await createStudentAppointment(page);
    await expect(page.getByTestId("student-appointment-card").first()).toContainText("待确认");
    await context.close();
  });

  test("counselor changes password and completes the appointment lifecycle", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(urls.counselor);
    await page.getByTestId("counselor-account").fill(fixtures.counselor.account);
    await page.getByTestId("counselor-password").fill(fixtures.counselor.temporaryPassword);
    await page.getByTestId("counselor-login-submit").click();
    await expect(page.getByTestId("counselor-change-password-form")).toBeVisible();
    await changePassword(page, "counselor", fixtures.counselor.temporaryPassword, fixtures.counselor.newPassword);
    await expect(page.getByTestId("counselor-dashboard")).toBeVisible();
    await auditViewports(page, "counselor-dashboard");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "预约", exact: true }).click();
    const appointment = page.getByTestId("counselor-appointment-card").filter({ hasText: fixtures.student.name }).first();
    await expect(appointment).toContainText("待确认");
    await appointment.getByTestId("counselor-open-appointment").click();
    await page.getByTestId("counselor-confirm-appointment").click();
    await expect(page.getByTestId("counselor-checkin-appointment")).toBeVisible();
    await page.getByTestId("counselor-checkin-appointment").click();
    await expect(page.getByTestId("counselor-complete-appointment")).toBeVisible();
    await page.getByTestId("counselor-complete-appointment").click();
    await expect(page.getByTestId("counselor-appointment-detail")).toContainText("已完成");
    await context.close();
  });

  test("admin views dashboard, students, counselors and appointments", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await context.newPage();
    await page.goto(urls.admin);
    await page.getByTestId("admin-account").fill(fixtures.admin.account);
    await page.getByTestId("admin-password").fill(fixtures.admin.password);
    await page.getByTestId("admin-login-submit").click();
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(page.getByTestId("admin-dashboard")).toContainText(fixtures.student.name);
    await auditViewports(page, "admin-dashboard");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "学生管理" }).click();
    await expect(page.getByTestId("admin-students")).toContainText(fixtures.student.name);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "咨询师管理" }).click();
    await expect(page.getByTestId("admin-counselors")).toContainText(fixtures.counselor.name);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "预约管理" }).click();
    await expect(page.getByTestId("admin-appointments")).toContainText("已完成");
    await expectNoHorizontalOverflow(page);
    await context.close();
  });

  test("miniapp H5 changes password and renders the student home", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(urls.miniapp);
    await fillByTestId(page, "mini-account", fixtures.miniStudent.account);
    await fillByTestId(page, "mini-password", fixtures.miniStudent.temporaryPassword);
    await page.locator("[data-testid='mini-policy'] .login-checkbox").click();
    await expect(page.locator("[data-testid='mini-policy'] .login-checkbox")).toHaveClass(/checked/);
    await page.getByTestId("mini-login-submit").click();
    await expect(page.getByTestId("mini-old-password")).toBeVisible();
    await changePassword(page, "mini", fixtures.miniStudent.temporaryPassword, fixtures.miniStudent.newPassword);
    await expect(page.getByTestId("mini-student-home")).toBeVisible();
    await auditViewports(page, "mini-student-home");
    await context.close();
  });
});
