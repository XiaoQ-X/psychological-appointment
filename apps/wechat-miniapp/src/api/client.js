const STORAGE_TOKEN = "anxin_mini_token";
const STORAGE_ROLE = "anxin_mini_role";
const STORAGE_USER = "anxin_mini_user";
const CONFIGURED_API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
const DEVTOOLS_API_BASE_URL = import.meta.env?.VITE_API_DEVTOOLS_BASE_URL || "http://127.0.0.1:3000";
const API_TIMEOUT_MS = Number(import.meta.env?.VITE_API_TIMEOUT_MS || 8000);

function cleanBaseUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

function isDevtoolsRuntime() {
  try {
    return uni.getSystemInfoSync?.().platform === "devtools";
  } catch (error) {
    return false;
  }
}

function isLocalH5Runtime() {
  try {
    if (typeof window === "undefined" || !window.location) return false;
    return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  } catch (error) {
    return false;
  }
}

export function getApiBaseUrl() {
  return cleanBaseUrl(isDevtoolsRuntime() || isLocalH5Runtime() ? DEVTOOLS_API_BASE_URL : CONFIGURED_API_BASE_URL);
}

export function resolveApiAssetUrl(url) {
  const text = String(url || "").trim();
  if (!text || /^https?:\/\//i.test(text) || text.startsWith("data:") || text.startsWith("blob:")) return text;
  if (text.startsWith("/")) return `${getApiBaseUrl()}${text}`;
  return text;
}

export function getToken() {
  return uni.getStorageSync(STORAGE_TOKEN);
}

export function getRole() {
  return uni.getStorageSync(STORAGE_ROLE);
}

export function getUser() {
  return uni.getStorageSync(STORAGE_USER) || null;
}

export function clearSession() {
  uni.removeStorageSync(STORAGE_TOKEN);
  uni.removeStorageSync(STORAGE_ROLE);
  uni.removeStorageSync(STORAGE_USER);
}

export function saveSession(data) {
  uni.setStorageSync(STORAGE_TOKEN, data.token);
  uni.setStorageSync(STORAGE_ROLE, data.role);
  uni.setStorageSync(STORAGE_USER, data.user);
}

export function updateCurrentUser(data = {}) {
  if (data.token) uni.setStorageSync(STORAGE_TOKEN, data.token);
  if (data.role) uni.setStorageSync(STORAGE_ROLE, data.role);
  if (data.user) uni.setStorageSync(STORAGE_USER, data.user);
}

export function request(path, options = {}) {
  const token = getToken();
  const baseUrl = getApiBaseUrl();
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseUrl}${path}`,
      method: options.method || "GET",
      data: options.data,
      timeout: options.timeout || API_TIMEOUT_MS,
      header: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success(response) {
        const payload = response.data || {};
        if (response.statusCode >= 400 || payload.success === false) {
          if (response.statusCode === 401 && !options.skipAuthRedirect) {
            clearSession();
            uni.reLaunch({ url: "/pages/login/login" });
          }
          reject(new Error(payload.message || "请求失败"));
          return;
        }
        resolve(payload.data);
      },
      fail(error) {
        const message = error.errMsg || "网络请求失败";
        if (/url not in domain|not in domain list/i.test(message)) {
          reject(new Error("当前服务域名未完成配置，请联系学校心理中心"));
          return;
        }
        if (/timeout|timed out/i.test(message)) {
          reject(new Error("服务连接超时，请稍后重试"));
          return;
        }
        reject(new Error("服务暂时无法连接，请稍后重试"));
      }
    });
  });
}

export async function login(role, body) {
  const data = await request(`/api/auth/${role}/login`, { method: "POST", data: body, skipAuthRedirect: true });
  saveSession(data);
  return data;
}
