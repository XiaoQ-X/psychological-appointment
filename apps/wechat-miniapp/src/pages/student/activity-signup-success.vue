<template>
  <view class="mobile-container signup-success-page">
    <status-bar />
    <page-header title="报名成功" show-back @back="goActivities" />

    <scroll-view class="success-content" scroll-y enhanced :show-scrollbar="false">
      <view class="success-inner">
        <view class="success-hero">
          <view class="success-icon">
            <view class="mini-icon check"></view>
          </view>
          <text class="success-title">报名成功！</text>
          <text class="success-desc">活动开始前会通过消息通知你</text>
        </view>

        <view class="success-card">
          <view class="success-row">
            <text class="success-label">活动</text>
            <text class="success-value">{{ summary.title }}</text>
          </view>
          <view class="success-row">
            <text class="success-label">时间</text>
            <text class="success-value">{{ summary.time }}</text>
          </view>
          <view class="success-row">
            <text class="success-label">地点</text>
            <text class="success-value">{{ summary.location }}</text>
          </view>
          <view class="success-row">
            <text class="success-label">状态</text>
            <text class="status-pill">{{ summary.statusText }}</text>
          </view>
        </view>

        <view class="success-actions">
          <button class="primary-action" @click="go('/pages/student/my-activities')">查看我的活动</button>
          <button class="secondary-action" @click="goActivities">返回活动列表</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getActivityDetail } from "../../api/student";
import { goPrimaryPage } from "@/utils/navigation";

const summary = ref({
  title: "活动待确认",
  time: "时间待确认",
  location: "地点待确认",
  statusText: "报名成功"
});

onLoad((query = {}) => {
  restoreSignupSummary(query.activityId || query.id);
});

async function restoreSignupSummary(activityId) {
  const stored = uni.getStorageSync("student_latest_activity_signup");
  if (stored?.activity) {
    summary.value = {
      title: stored.activity.title || "活动待确认",
      time: stored.activity.time || "时间待确认",
      location: stored.activity.location || "地点待确认",
      statusText: statusText(stored.signup?.status)
    };
    return;
  }
  if (!activityId) return;
  try {
    const detail = await getActivityDetail(activityId);
    summary.value = {
      title: detail.title || "活动待确认",
      time: formatRange(detail.startAt, detail.endAt),
      location: detail.location || "地点待确认",
      statusText: "报名成功"
    };
  } catch (error) {
    uni.showToast({ title: error.message || "报名结果加载失败", icon: "none" });
  }
}

function statusText(status) {
  const map = {
    signed: "报名成功",
    cancelled: "已取消",
    waitlisted: "候补中"
  };
  return map[status] || "报名成功";
}

function formatRange(start, end) {
  const startDate = formatDateTime(start);
  const endDate = formatTime(end);
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  return startDate || "时间待确认";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hour}:${minute}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function go(url) {
  goPrimaryPage(url);
}

function goActivities() {
  goPrimaryPage("/pages/student/activities");
}
</script>

<style scoped>
.signup-success-page {
  background: #f8fafc;
}

.success-content {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.success-inner {
  padding: 56rpx 40rpx 48rpx;
  text-align: center;
}

.success-hero {
  padding: 32rpx 0 40rpx;
}

.success-icon {
  width: 112rpx;
  height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28rpx;
  border-radius: 999rpx;
  color: #22c55e;
  background: #dcfce7;
}

.success-icon .mini-icon {
  width: 72rpx;
  height: 72rpx;
}

.success-title,
.success-desc,
.success-label,
.success-value {
  display: block;
}

.success-title {
  color: #1f2937;
  font-size: 40rpx;
  font-weight: 900;
}

.success-desc {
  margin-top: 24rpx;
  color: #9ca3af;
  font-size: 28rpx;
}

.success-card {
  margin-bottom: 48rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  text-align: left;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.success-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 18rpx;
}

.success-row:first-child {
  margin-top: 0;
}

.success-label {
  color: #9ca3af;
  font-size: 24rpx;
}

.success-value {
  flex: 1;
  color: #374151;
  font-size: 24rpx;
  font-weight: 800;
  text-align: right;
}

.status-pill {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  color: #16a34a;
  background: #f0fdf4;
  font-size: 20rpx;
  font-weight: 800;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.primary-action,
.secondary-action {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.primary-action {
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}

.secondary-action {
  color: #4A90D9;
  border: 1rpx solid #bfdbfe;
  background: #eff6ff;
}
/* 上线前自适应收口：成功页字段过长时保持卡片自适应。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.success-row {
  align-items: flex-start;
}

.success-value {
  min-width: 0;
  white-space: normal;
}
</style>
