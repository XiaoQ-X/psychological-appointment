<template>
  <view class="mobile-container my-activities-page">
    <status-bar />
    <page-header title="我的活动" show-back @back="goProfile" />

    <view class="activity-tabbar">
      <button
        v-for="item in tabs"
        :key="item.key"
        :class="['activity-tab', { active: activeTab === item.key }]"
        @click="selectTab(item.key)"
      >
        {{ item.label }}
      </button>
    </view>

    <view class="my-activity-wrap">
      <scroll-view class="my-activity-content" scroll-y enhanced :show-scrollbar="false">
        <view class="my-activity-inner">
          <view v-if="loading" class="activity-empty">
            <view class="empty-icon"><view class="mini-icon calendar"></view></view>
            <text class="empty-title">活动记录加载中</text>
            <text class="empty-desc">请稍候</text>
          </view>

          <view v-else-if="filteredActivities.length" class="activity-list">
            <view v-for="activity in filteredActivities" :key="activity.id" class="activity-record">
              <view class="record-head">
                <view :class="['record-icon', activity.tone]">
                  <view :class="['mini-icon', activity.icon]"></view>
                </view>
                <view class="record-main">
                  <text class="record-title">{{ activity.name }}</text>
                  <view class="record-meta-row">
                    <text>{{ activity.type }}</text>
                    <text>{{ activity.date }}</text>
                    <text>{{ activity.location }}</text>
                  </view>
                </view>
              </view>

              <view class="record-tags">
                <text :class="['record-tag', activity.status]">{{ activity.statusText }}</text>
                <text :class="['record-tag', activity.checkinStatus]">{{ activity.checkin }}</text>
              </view>

              <view class="record-actions">
                <button class="record-link" @click="showDetail(activity)">查看详情</button>
                <button v-if="activity.canCancel" class="record-cancel disabled" disabled>联系中心取消</button>
              </view>
              <text v-if="activity.canCancel" class="record-disabled-note">如需取消报名，请联系拾光心理中心处理。</text>
            </view>
          </view>

          <view v-else class="activity-empty">
            <view class="empty-icon"><view class="mini-icon calendar"></view></view>
            <text class="empty-title">暂未报名任何活动</text>
            <text class="empty-desc">你还没有报名任何活动</text>
            <button class="empty-action" @click="go('/pages/student/activities')">去看看活动</button>
          </view>
        </view>
      </scroll-view>
    </view>

    <bottom-tabbar role="student" active="profile" />
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getActivitySignups } from "../../api/student";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const tabs = [
  { key: "all", label: "全部" },
  { key: "registered", label: "已报名" },
  { key: "ended", label: "已结束" },
  { key: "cancelled", label: "已取消" }
];

const activeTab = ref("all");
const loading = ref(false);
const activities = ref([]);

onShow(() => {
  loadMyActivities();
});

const filteredActivities = computed(() => {
  return activities.value;
});

function selectTab(key) {
  activeTab.value = key;
  loadMyActivities();
}

async function loadMyActivities() {
  loading.value = true;
  try {
    const params = { page: 1, pageSize: 50 };
    if (activeTab.value !== "all") params.status = activeTab.value;
    const result = await getActivitySignups(params);
    activities.value = (Array.isArray(result?.items) ? result.items : []).map(normalizeSignup);
  } catch (error) {
    activities.value = [];
    uni.showToast({ title: error.message || "我的活动加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeSignup(item = {}) {
  const activity = item.activity || {};
  const status = normalizeStatus(item.status, item.activityEndAt || activity.endAt);
  return {
    id: item.id,
    activityId: item.activityId,
    name: item.activityTitle || activity.title || "活动待确认",
    type: activity.category || "心理活动",
    date: formatRange(item.activityStartAt || activity.startAt, item.activityEndAt || activity.endAt),
    location: item.location || activity.location || "地点待确认",
    status,
    statusText: statusText(status),
    checkin: status === "ended" ? "已结束" : status === "cancelled" ? "—" : "未签到",
    checkinStatus: status === "ended" ? "done" : status === "cancelled" ? "cancelled" : "waiting",
    icon: iconByCategory(activity.category),
    tone: toneByStatus(status),
    canCancel: status === "registered" || status === "pending"
  };
}

function normalizeStatus(status, endAt) {
  if (status === "cancelled") return "cancelled";
  const endDate = new Date(endAt);
  if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) return "ended";
  return status === "signed" ? "registered" : status || "registered";
}

function statusText(status) {
  const map = {
    registered: "报名成功",
    pending: "待参加",
    ended: "已结束",
    cancelled: "已取消"
  };
  return map[status] || "报名成功";
}

function iconByCategory(category = "") {
  if (category.includes("讲座")) return "bell";
  if (category.includes("主题")) return "star";
  if (category.includes("工作坊") || category.includes("团体")) return "meditation";
  return "calendar";
}

function toneByStatus(status) {
  const map = {
    registered: "blue",
    pending: "orange",
    ended: "green",
    cancelled: "gray"
  };
  return map[status] || "blue";
}

function formatRange(start, end) {
  const startDate = formatDateTime(start);
  const endDate = formatTime(end);
  if (startDate && endDate) return `${startDate}-${endDate}`;
  return startDate || "时间待确认";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function go(url) {
  goPage(url);
}

function goProfile() {
  goPrimaryPage("/pages/student/profile");
}

function showDetail(activity) {
  if (!activity.activityId) return;
  go(`/pages/student/activity-detail?id=${activity.activityId}`);
}

</script>

<style scoped>
.my-activities-page {
  background: #f8fafc;
}

.activity-tabbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
  background: #fff;
}

.activity-tab {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-bottom: 4rpx solid transparent;
  border-radius: 0;
  color: #9ca3af;
  background: transparent;
  font-size: 28rpx;
  font-weight: 800;
}

.activity-tab.active {
  color: #4A90D9;
  border-bottom-color: #4A90D9;
}

.my-activity-wrap {
  flex: 1;
  min-height: 0;
}

.my-activity-content {
  height: 100%;
  padding-bottom: 144rpx;
}

.my-activity-inner {
  padding: 32rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.activity-record {
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.record-head {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.record-icon {
  width: 88rpx;
  height: 88rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.record-icon .mini-icon,
.empty-icon .mini-icon {
  width: 48rpx;
  height: 48rpx;
}

.record-icon.blue { color: #3b82f6; background: #eff6ff; }
.record-icon.orange { color: #f97316; background: #fff7ed; }
.record-icon.green { color: #22c55e; background: #f0fdf4; }
.record-icon.gray { color: #94a3b8; background: #f1f5f9; }

.record-main {
  flex: 1;
  min-width: 0;
}

.record-title,
.record-meta-row text {
  display: block;
}

.record-title {
  color: #1f2937;
  font-size: 30rpx;
  line-height: 1.4;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.record-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx 24rpx;
  margin-top: 16rpx;
}

.record-meta-row text {
  color: #9ca3af;
  font-size: 20rpx;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.record-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 28rpx;
}

.record-tag {
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 800;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.record-tag.registered,
.record-tag.done {
  color: #16a34a;
  background: #f0fdf4;
}

.record-tag.pending {
  color: #2563eb;
  background: #eff6ff;
}

.record-tag.waiting {
  color: #d97706;
  background: #fffbeb;
}

.record-tag.ended {
  color: #16a34a;
  background: #f0fdf4;
}

.record-tag.cancelled {
  color: #6b7280;
  background: #f3f4f6;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 28rpx;
  margin-top: 28rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f3f4f6;
}

.record-link,
.record-cancel {
  background: transparent;
  font-size: 24rpx;
  font-weight: 800;
}

.record-link {
  color: #4A90D9;
}

.record-cancel {
  color: #ef4444;
}

.record-cancel.disabled {
  color: #9ca3af;
  background: #f3f4f6;
}

.record-disabled-note {
  display: block;
  margin-top: 14rpx;
  color: #9ca3af;
  font-size: 22rpx;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.activity-empty {
  padding: 96rpx 40rpx;
  text-align: center;
}

.empty-icon {
  width: 128rpx;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  border-radius: 999rpx;
  color: #cbd5e1;
  background: #f1f5f9;
}

.empty-title,
.empty-desc {
  display: block;
}

.empty-title {
  color: #9ca3af;
  font-size: 32rpx;
  font-weight: 900;
}

.empty-desc {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.empty-action {
  min-width: 208rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 36rpx auto 0;
  padding: 0 40rpx;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 800;
}
</style>
