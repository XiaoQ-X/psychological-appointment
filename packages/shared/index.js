export const appointmentStatusLabels = {
  pending: "待确认",
  confirmed: "已确认",
  in_progress: "咨询中",
  completed: "已完成",
  cancelled: "已取消",
  rejected: "已拒绝",
  no_show: "未到"
};

export const riskLevelLabels = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  crisis: "危机风险"
};

export const processStatusLabels = {
  open: "待处理",
  following: "跟进中",
  handled: "已处理",
  closed: "已结案"
};

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("zh-CN");
}

export default {
  appointmentStatusLabels,
  riskLevelLabels,
  processStatusLabels,
  formatDateTime,
  formatDate
};
