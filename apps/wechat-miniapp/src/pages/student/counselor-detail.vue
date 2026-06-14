<template>
  <view class="mobile-container sp-page" :style="layoutStyle">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header">
      <button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">咨询师详情</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="detail-stack">
          <view v-if="errorText" class="detail-error-card">
            <text>{{ errorText }}</text>
            <button @click="go('/pages/student/counselors')">返回咨询师列表</button>
          </view>

          <view class="detail-hero">
            <image class="detail-avatar detail-avatar-image" mode="aspectFill" :src="counselorAvatar" />
            <text class="detail-name">{{ counselor.name }}</text>
            <text class="detail-title">{{ counselor.title }}</text>
            <view class="detail-meta">
              <text>{{ campusName }}</text>
              <text>{{ roomName }}</text>
            </view>
            <view class="detail-stars">
              <text>★★★★★</text>
              <text class="score">暂无评分</text>
            </view>
          </view>

          <view class="detail-section">
            <text class="detail-section-title">擅长领域</text>
            <view class="detail-tags">
              <text v-for="tag in specialties" :key="tag">{{ tag }}</text>
              <text v-if="!specialties.length">暂无擅长领域</text>
            </view>
          </view>

          <view class="detail-section">
            <text class="detail-section-title">个人简介</text>
            <text class="detail-paragraph">{{ counselor.introduction }}</text>
            <view class="detail-inline-info">
              <text><text class="strong">职称：</text>{{ counselor.title }}</text>
              <text><text class="strong">校区：</text>{{ campusName }}</text>
            </view>
          </view>

          <view class="detail-section time-section">
            <view class="section-heading-row">
              <view class="mini-icon calendar"></view>
              <text class="detail-section-title">可预约时间</text>
            </view>
            <scroll-view class="date-strip" scroll-x enhanced :show-scrollbar="false">
              <view class="date-strip-inner">
                <button v-for="date in scheduleDates" :key="date.key" :class="['proto-date', { active: date.key === selectedDateKey }]" @click="selectedDateKey = date.key"><text>{{ date.date }}</text><text>{{ date.week }}</text></button>
              </view>
            </scroll-view>
            <view class="time-list">
              <view v-for="item in selectedSchedules" :key="item.id" class="time-row available" @click="selectedScheduleId = item.id"><view><view class="mini-icon clock"></view><text>{{ item.timeText }}</text></view><text>{{ item.id === selectedScheduleId ? '已选择' : '可预约' }}</text></view>
              <view v-if="!selectedSchedules.length" class="time-row full"><view><view class="mini-icon clock"></view><text>暂无可约时段</text></view><text>无可约</text></view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="sp-bottom-actions above-tabbar">
      <button class="sp-primary" :disabled="!!errorText || !selectedScheduleId" @click="goBooking">{{ selectedScheduleId ? "预约咨询" : "暂无可约时段" }}</button>
    </view>

    <view class="sp-tabbar">
      <button class="sp-tab" @click="goHome"><view class="mini-icon home"></view><text>首页</text></button>
      <button class="sp-tab active" @click="go('/pages/student/counselors')"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab" @click="go('/pages/student/articles')"><view class="mini-icon newspaper"></view><text>资讯</text></button>
      <button class="sp-tab" @click="go('/pages/student/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorDetail, getSchedules } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const layoutStyle = getLayoutVars();

const counselorId = ref("");
const errorText = ref("");
const counselor = ref({
  name: "咨询师详情",
  title: "心理咨询师",
  introduction: "正在加载咨询师资料..."
});
const schedules = ref([]);
const selectedDateKey = ref("");
const selectedScheduleId = ref("");

const specialties = computed(() => Array.isArray(counselor.value.specialties) ? counselor.value.specialties : []);
const counselorInitial = computed(() => (counselor.value.name || "咨").slice(0, 1));
const counselorAvatar = computed(() => resolveApiAssetUrl(counselor.value.avatar) || BRAND_ASSETS.defaultCounselorAvatar);
const campusName = computed(() => counselor.value.campus?.name || schedules.value[0]?.campus?.name || "校区待确认");
const roomName = computed(() => schedules.value.find((item) => item.id === selectedScheduleId.value)?.room?.name || schedules.value[0]?.room?.name || "咨询室待确认");
const scheduleDates = computed(() => {
  const map = new Map();
  schedules.value.forEach((item) => {
    const date = new Date(item.startAt);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, {
        key,
        date: date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
        week: `周${"日一二三四五六"[date.getDay()]}`
      });
    }
  });
  return [...map.values()];
});
const selectedSchedules = computed(() => schedules.value
  .filter((item) => item.dateKey === selectedDateKey.value)
  .map((item) => ({ ...item, timeText: `${formatTime(item.startAt)} - ${formatTime(item.endAt)}` })));

onLoad((query = {}) => {
  counselorId.value = query.id || query.counselorId || "";
  loadDetail();
});

async function loadDetail() {
  if (!counselorId.value) {
    errorText.value = "缺少咨询师信息，请返回咨询师列表重新选择。";
    uni.showToast({ title: "缺少咨询师信息", icon: "none" });
    return;
  }
  try {
    const [detail, scheduleList] = await Promise.all([
      getCounselorDetail(counselorId.value),
      getSchedules({ counselorId: counselorId.value })
    ]);
    counselor.value = detail || counselor.value;
    schedules.value = normalizeSchedules(scheduleList);
    selectedDateKey.value = schedules.value[0]?.dateKey || "";
    selectedScheduleId.value = schedules.value[0]?.id || "";
  } catch (error) {
    errorText.value = error.message || "咨询师详情加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "咨询师详情加载失败", icon: "none" });
  }
}

function normalizeSchedules(list = []) {
  return (Array.isArray(list) ? list : []).map((item) => {
    const date = new Date(item.startAt);
    return {
      ...item,
      dateKey: Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
    };
  }).filter((item) => item.dateKey);
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}

function back() {
  safeBackStudent("/pages/student/counselors");
}

function goBooking() {
  if (!counselorId.value || errorText.value) return;
  if (!selectedScheduleId.value) {
    uni.showToast({ title: "该咨询师暂无可约时段", icon: "none" });
    return;
  }
  const schedulePart = selectedScheduleId.value ? `&scheduleId=${selectedScheduleId.value}` : "";
  go(`/pages/student/booking-form?counselorId=${counselorId.value}${schedulePart}`);
}
</script>

<style scoped>
.detail-stack {
  padding-bottom: 250rpx;
  background: #f8fafc;
}

.detail-hero {
  display: grid;
  justify-items: center;
  gap: 10rpx;
  padding: 48rpx 40rpx 38rpx;
  border-bottom: 1rpx solid #f3f4f6;
  background: #fff;
  text-align: center;
}

.detail-avatar {
  width: 192rpx;
  height: 192rpx;
  display: grid;
  place-items: center;
  margin-bottom: 8rpx;
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 12rpx 28rpx rgba(74,144,217,.25);
  font-size: 56rpx;
  font-weight: 900;
}

.detail-avatar-image {
  display: block;
  background: #DBEAFE;
}

.detail-name {
  color: #1f2937;
  font-size: 40rpx;
  font-weight: 900;
}

.detail-title {
  color: #9ca3af;
  font-size: 26rpx;
}

.detail-meta,
.detail-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.detail-stars {
  gap: 6rpx;
  color: #F5A623;
  font-size: 24rpx;
}

.detail-stars .score {
  margin-left: 8rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.detail-section {
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
  background: #fff;
}

.detail-section-title {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 24rpx;
}

.detail-tags text {
  padding: 12rpx 24rpx;
  border: 1rpx solid #4A90D9;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EBF3FC;
  font-size: 24rpx;
  font-weight: 700;
}

.detail-paragraph {
  display: block;
  margin-top: 22rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.75;
}

.detail-inline-info {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-top: 22rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.detail-inline-info .strong {
  color: #4b5563;
  font-weight: 800;
}

.section-heading-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-heading-row .mini-icon {
  width: 32rpx;
  height: 32rpx;
  color: #10B981;
}

.date-strip {
  width: 100%;
  margin-top: 22rpx;
  white-space: nowrap;
}

.date-strip-inner {
  display: flex;
  gap: 16rpx;
}

.proto-date {
  width: 112rpx;
  height: 86rpx;
  display: grid;
  place-items: center;
  gap: 2rpx;
  flex: none;
  border-radius: 24rpx;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 22rpx;
}

.proto-date text:first-child {
  font-weight: 900;
}

.proto-date.active {
  color: #fff;
  background: #4A90D9;
}

.time-list {
  display: grid;
  gap: 16rpx;
  margin-top: 22rpx;
}

.time-row {
  min-height: 92rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.time-row > view {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.time-row .mini-icon {
  width: 30rpx;
  height: 30rpx;
}

.time-row.available {
  border: 1rpx solid #bbf7d0;
  color: #15803d;
  background: #f0fdf4;
}

.time-row.available > text {
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  font-size: 22rpx;
}

.time-row.full {
  border: 1rpx solid #e5e7eb;
  color: #9ca3af;
  background: #f3f4f6;
}

.time-row.full > text {
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background: #e5e7eb;
  font-size: 22rpx;
}

.sp-bottom-actions {
  bottom: 128rpx;
}

.detail-error-card {
  display: grid;
  gap: 20rpx;
  margin: 32rpx 40rpx 0;
  padding: 28rpx;
  border: 1rpx solid #fecaca;
  border-radius: 24rpx;
  color: #b91c1c;
  background: #fef2f2;
  font-size: 24rpx;
}

.detail-error-card button {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
