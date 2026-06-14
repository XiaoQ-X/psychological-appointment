import { getApiBaseUrl, getToken, request } from "./client";

function withQuery(path, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${path}${query ? `?${query}` : ""}`;
}

export function getStudentHome() {
  return request("/api/student/home");
}

export function getCounselors(params = {}) {
  return request(withQuery("/api/student/counselors", params));
}

export function getCounselorDetail(id) {
  return request(`/api/student/counselors/${id}`);
}

export function getSchedules(params = {}) {
  return request(withQuery("/api/student/schedules", params));
}

export function submitRiskAssessment(data) {
  return request("/api/student/risk-assessments", { method: "POST", data });
}

export function createAppointment(data) {
  return request("/api/student/appointments", { method: "POST", data });
}

export function getAppointments(params = {}) {
  return request(withQuery("/api/student/appointments", params));
}

export function getAppointmentDetail(id) {
  return request(`/api/student/appointments/${id}`);
}

export function cancelAppointment(id, data = {}) {
  return request(`/api/student/appointments/${id}/cancel`, { method: "POST", data });
}

export function rescheduleAppointment(id, data = {}) {
  return request(`/api/student/appointments/${id}/reschedule`, { method: "POST", data });
}

export function submitAppointmentFeedback(id, data = {}) {
  return request(`/api/student/appointments/${id}/feedback`, { method: "POST", data });
}

export function getArticles(params = {}) {
  return request(withQuery("/api/student/articles", params));
}

export function getArticleDetail(id) {
  return request(`/api/student/articles/${id}`);
}

export function getActivities(params = {}) {
  return request(withQuery("/api/student/activities", params));
}

export function getActivityDetail(id) {
  return request(`/api/student/activities/${id}`);
}

export function signupActivity(id, data = {}) {
  return request(`/api/student/activities/${id}/signup`, { method: "POST", data });
}

export function getActivitySignups(params = {}) {
  return request(withQuery("/api/student/activity-signups", params));
}

export function getAssessments(params = {}) {
  return request(withQuery("/api/student/assessments", params));
}

export function getAssessmentDetail(id) {
  return request(`/api/student/assessments/${id}`);
}

export function submitAssessmentResult(data = {}) {
  return request("/api/student/assessment-results", { method: "POST", data });
}

export function getAssessmentResults(params = {}) {
  return request(withQuery("/api/student/assessment-results", params));
}

export function getMessages(params = {}) {
  return request(withQuery("/api/student/messages", params));
}

export function getMessageDetail(id) {
  return request(`/api/student/messages/${id}`);
}

export function markMessageRead(id) {
  return request(`/api/student/messages/${id}/read`, { method: "POST" });
}

export function getStudentProfile() {
  return request("/api/student/profile");
}

export function updateStudentProfile(data = {}) {
  return request("/api/student/profile", { method: "PUT", data });
}

export function uploadStudentAvatar(filePath) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${getApiBaseUrl()}/api/student/profile/avatar`,
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

export function getStudentPrivacy() {
  return request("/api/student/privacy");
}

export function acceptStudentPrivacy(data = {}) {
  return request("/api/student/privacy/accept", { method: "POST", data });
}

export function submitSystemFeedback(data = {}) {
  return request("/api/student/system-feedback", { method: "POST", data });
}
