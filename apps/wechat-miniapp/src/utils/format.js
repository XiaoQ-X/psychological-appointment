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

export function statusText(status) {
  return {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到",
    active: "正常",
    available: "可预约",
    booked: "已占用",
    disabled: "已停用",
    accepted: "已接收",
    approved: "已通过",
    closed: "已关闭",
    open: "待跟进",
    following: "跟进中",
    handled: "已处理",
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    crisis: "危机"
  }[status] || status || "-";
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  });
}

export function toast(title, icon = "none") {
  uni.showToast({ title, icon, duration: 1800 });
}
