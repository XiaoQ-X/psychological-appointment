import { getApiBaseUrl, getToken, request } from "./client";

function withQuery(path, params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) return path;
  const query = entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  return `${path}?${query}`;
}

export function getCounselorDashboard() {
  return request("/api/counselor/dashboard");
}

export function getCounselorAppointments(params = {}) {
  return request(withQuery("/api/counselor/appointments", params));
}

export function getCounselorAppointment(id) {
  return request(`/api/counselor/appointments/${id}`);
}

export function confirmAppointment(id, data = {}) {
  return request(`/api/counselor/appointments/${id}/confirm`, { method: "POST", data });
}

export function rejectAppointment(id, data = {}) {
  return request(`/api/counselor/appointments/${id}/reject`, { method: "POST", data });
}

export function checkinAppointment(id, data = {}) {
  return request(`/api/counselor/appointments/${id}/checkin`, { method: "POST", data });
}

export function completeAppointment(id, data = {}) {
  return request(`/api/counselor/appointments/${id}/complete`, { method: "POST", data });
}

export function saveCounselorRecord(data = {}) {
  return request("/api/counselor/records", { method: "POST", data });
}

export function getCounselorMessages(params = {}) {
  return request(withQuery("/api/counselor/messages", params));
}

export function getCounselorMessage(id) {
  return request(`/api/counselor/messages/${id}`);
}

export function markCounselorMessageRead(id) {
  return request(`/api/counselor/messages/${id}/read`, { method: "POST" });
}

export function getCounselorProfile() {
  return request("/api/counselor/profile");
}

export function updateCounselorProfile(data = {}) {
  return request("/api/counselor/profile", { method: "PUT", data });
}

export function uploadCounselorAvatar(filePath) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${getApiBaseUrl()}/api/counselor/profile/avatar`,
      filePath,
      name: "avatar",
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(response) {
        let payload = response.data || {};
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (error) {
            reject(new Error("头像上传响应格式不正确"));
            return;
          }
        }
        if (response.statusCode >= 400 || payload.success === false) {
          reject(new Error(payload.message || "头像上传失败"));
          return;
        }
        resolve(payload.data);
      },
      fail(error) {
        reject(new Error(error.errMsg || "头像上传失败"));
      }
    });
  });
}

export function getCounselorStudents() {
  return request("/api/counselor/students");
}

export function getCounselorStudent(id) {
  return request(`/api/counselor/students/${id}`);
}

export function getCounselorRiskRecords(params = {}) {
  return request(withQuery("/api/counselor/risk-records", params));
}

export async function getCounselorRiskRecord(id) {
  const records = await getCounselorRiskRecords();
  const record = (Array.isArray(records) ? records : []).find((item) => item.id === id);
  if (!record) {
    throw new Error("风险记录不存在或暂无权限查看");
  }
  return record;
}

export function submitRiskFeedback(data = {}) {
  return request("/api/counselor/risk-feedback", { method: "POST", data });
}

export function getCounselorSchedules(params = {}) {
  return request(withQuery("/api/counselor/schedules", params));
}

export function createCounselorSchedule(data = {}) {
  return request("/api/counselor/schedules", { method: "POST", data });
}

export function getCounselorRooms() {
  return request("/api/counselor/rooms");
}

export function submitShiftApplication(data = {}) {
  return request("/api/counselor/shift-applications", { method: "POST", data });
}

export function getCounselorReferrals(params = {}) {
  return request(withQuery("/api/counselor/referrals", params));
}

export function getCounselorReferral(id) {
  return request(`/api/counselor/referrals/${id}`);
}

export function createCounselorReferral(data = {}) {
  return request("/api/counselor/referrals", { method: "POST", data });
}

export function acceptCounselorReferral(id) {
  return request(`/api/counselor/referrals/${id}/accept`, { method: "POST" });
}

export function rejectCounselorReferral(id, data = {}) {
  return request(`/api/counselor/referrals/${id}/reject`, { method: "POST", data });
}

export function getAvailableCounselors() {
  return request("/api/counselor/available-counselors");
}

export function getCounselorArticles() {
  return request("/api/counselor/articles");
}
