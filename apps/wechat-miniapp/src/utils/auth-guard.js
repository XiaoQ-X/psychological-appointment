import { clearSession, getRole, getToken } from "../api/client";

const LOGIN_URL = "/pages/login/login";
const PUBLIC_PAGES = new Set([
  LOGIN_URL,
  "/pages/student/emergency"
]);
const ROLE_HOME = {
  student: "/pages/student/home",
  counselor: "/pages/counselor/dashboard"
};

let guardInstalled = false;
let redirecting = false;

export function normalizeUrl(url = "") {
  const rawUrl = String(url || "");
  const [path] = rawUrl.split("?");
  return path.startsWith("/") ? path : `/${path}`;
}

export function isLoginPage(url = "") {
  return normalizeUrl(url) === LOGIN_URL;
}

export function isPublicPage(url = "") {
  return PUBLIC_PAGES.has(normalizeUrl(url));
}

export function getRequiredRole(url = "") {
  const path = normalizeUrl(url);
  if (path.startsWith("/pages/student/")) return "student";
  if (path.startsWith("/pages/counselor/")) return "counselor";
  return "";
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || LOGIN_URL;
}

export function getCurrentPageUrl() {
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
  const current = pages[pages.length - 1];
  if (!current?.route) return "";
  return `/${current.route}`;
}

export function showAccessToast(title) {
  uni.showToast({ title, icon: "none" });
}

export function redirectToLogin() {
  if (redirecting) return;
  redirecting = true;
  uni.reLaunch({
    url: LOGIN_URL,
    complete() {
      setTimeout(() => {
        redirecting = false;
      }, 120);
    }
  });
}

export function redirectToRoleHome(role) {
  if (redirecting) return;
  redirecting = true;
  uni.reLaunch({
    url: getRoleHome(role),
    complete() {
      setTimeout(() => {
        redirecting = false;
      }, 120);
    }
  });
}

export function checkPageAccess(url, options = {}) {
  const path = normalizeUrl(url || getCurrentPageUrl());
  if (!path || isPublicPage(path)) return true;

  const requiredRole = getRequiredRole(path);
  if (!requiredRole) return true;

  const token = getToken();
  const role = getRole();

  if (!token || !role) {
    clearSession();
    if (!options.silent) showAccessToast("请先登录");
    redirectToLogin();
    return false;
  }

  if (role !== requiredRole) {
    if (role !== "student" && role !== "counselor") {
      clearSession();
      if (!options.silent) showAccessToast("账号角色不支持进入小程序");
      redirectToLogin();
      return false;
    }
    if (!options.silent) {
      showAccessToast(requiredRole === "counselor" ? "无权访问咨询师端" : "无权访问学生端");
    }
    redirectToRoleHome(role);
    return false;
  }

  return true;
}

export function checkCurrentPageAccess(options = {}) {
  const currentUrl = getCurrentPageUrl();
  if (!currentUrl) return true;
  return checkPageAccess(currentUrl, options);
}

export function installRouteGuard() {
  if (guardInstalled) return;
  guardInstalled = true;

  ["navigateTo", "redirectTo", "reLaunch", "switchTab"].forEach((method) => {
    uni.addInterceptor(method, {
      invoke(args = {}) {
        return checkPageAccess(args.url);
      }
    });
  });
}
