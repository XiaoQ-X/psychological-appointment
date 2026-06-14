import { login, request, clearSession, getRole, getToken, getUser, updateCurrentUser } from "./client";

export function loginStudent(data) {
  return login("student", data);
}

export function loginCounselor(data) {
  return login("counselor", data);
}

export function getCurrentUser() {
  return request("/api/auth/me");
}

export function changePassword(data) {
  return request("/api/auth/change-password", { method: "POST", data });
}

export function logoutLocal() {
  clearSession();
}

export { getRole, getToken, getUser, updateCurrentUser };
