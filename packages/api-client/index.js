export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl || import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
  let accessToken = "";

  const token = () => accessToken;
  const setToken = (value) => {
    accessToken = value || "";
  };

  async function send(path, config = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(config.headers || {})
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(`${baseUrl}${path}`, {
      ...config,
      credentials: "include",
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

  async function refreshSession() {
    const data = await send("/api/auth/refresh", { method: "POST", skipRefresh: true });
    setToken(data.token);
    return data;
  }

  async function request(path, config = {}) {
    try {
      return await send(path, config);
    } catch (error) {
      const code = error.payload?.error?.code;
      if (config.skipRefresh || !["TOKEN_EXPIRED", "TOKEN_INVALID"].includes(code)) {
        throw error;
      }
      await refreshSession();
      return send(path, { ...config, skipRefresh: true });
    }
  }

  async function login(role, body) {
    const data = await send(`/api/auth/${role}/login`, { method: "POST", body, skipRefresh: true });
    setToken(data.token);
    return data;
  }

  return {
    request,
    token,
    setToken,
    refreshSession,
    async logout() {
      try {
        await send("/api/auth/logout", { method: "POST", skipRefresh: true });
      } finally {
        setToken(null);
      }
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
