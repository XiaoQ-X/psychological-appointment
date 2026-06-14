export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl || import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
  const storageKey = options.storageKey || "anxin_token";

  const token = () => localStorage.getItem(storageKey);
  const setToken = (value) => value ? localStorage.setItem(storageKey, value) : localStorage.removeItem(storageKey);

  async function request(path, config = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(config.headers || {})
    };
    const currentToken = token();
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;
    const response = await fetch(`${baseUrl}${path}`, {
      ...config,
      headers,
      body: config.body && typeof config.body !== "string" ? JSON.stringify(config.body) : config.body
    });
    const payload = await response.json().catch(() => ({ success: false, message: "响应解析失败" }));
    if (!response.ok || payload.success === false) {
      const error = new Error(payload.message || "请求失败");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload.data;
  }

  async function login(role, body) {
    const data = await request(`/api/auth/${role}/login`, { method: "POST", body });
    setToken(data.token);
    return data;
  }

  return {
    request,
    token,
    setToken,
    logout() {
      setToken(null);
    },
    loginStudent(body) {
      return login("student", body);
    },
    loginCounselor(body) {
      return login("counselor", body);
    },
    loginAdmin(body) {
      return login("admin", body);
    }
  };
}
