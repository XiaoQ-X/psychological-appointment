<template>
  <view class="mobile-container counselor-dashboard-proto" :style="layoutStyle">
    <view class="proto-status">
      <text class="proto-status-time">09:41</text>
      <view class="proto-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="proto-counselor-header">
      <view class="proto-counselor-user">
        <image class="proto-counselor-avatar" mode="aspectFill" :src="counselorAvatar" />
        <view>
          <text class="proto-counselor-name">{{ counselorName }} 老师</text>
          <view class="proto-online-row">
            <view class="proto-online-dot"></view>
            <text>在线</text>
          </view>
        </view>
      </view>
      <button class="proto-cog-button" @click="go('/pages/counselor/profile')">
        <view class="mini-icon gear"></view>
      </button>
    </view>

    <view class="proto-content">
      <scroll-view class="proto-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="proto-dashboard-hero">
          <image class="proto-dashboard-hero-image" mode="aspectFill" :src="BRAND_ASSETS.counselorDashboardHero" />
          <view class="proto-dashboard-hero-mask"></view>
          <view class="proto-dashboard-hero-copy">
            <text>拾光心理</text>
            <text>LightCatch 咨询师工作台</text>
          </view>
        </view>

        <view class="proto-risk-wrap">
          <view class="proto-risk-card">
            <view class="proto-risk-row">
              <view class="proto-risk-icon">
                <image class="brand-mini-icon" mode="aspectFit" :src="BRAND_ASSETS.riskIcon" />
              </view>
              <view class="proto-risk-body">
                <text class="proto-risk-title">风险提醒</text>
                <text class="proto-risk-empty">{{ riskMessage }}</text>
              </view>
              <button class="proto-risk-close">
                <view class="mini-icon close"></view>
              </button>
            </view>
          </view>
        </view>

        <view class="proto-stats-grid">
          <view class="proto-stat-card">
            <text class="proto-stat-label">今日预约</text>
            <view class="proto-stat-line">
              <text class="proto-stat-value">{{ todayAppointments.length }}</text>
              <text class="proto-stat-up">实时</text>
            </view>
          </view>
          <view class="proto-stat-card">
            <text class="proto-stat-label">待确认预约</text>
            <view class="proto-stat-line">
              <text class="proto-stat-value orange">{{ dashboard.pendingCount || 0 }}</text>
              <view class="proto-orange-dot"></view>
            </view>
          </view>
          <view class="proto-stat-card">
            <text class="proto-stat-label">待处理风险</text>
            <text class="proto-stat-value red">{{ dashboard.riskCount || 0 }}</text>
          </view>
          <view class="proto-stat-card">
            <text class="proto-stat-label">未读消息</text>
            <text class="proto-stat-value blue">{{ unreadMessageCount }}</text>
          </view>
        </view>

        <view class="proto-quick-actions">
          <button class="proto-quick-pill blue" @click="go('/pages/counselor/schedule')">
            <view class="mini-icon calendar"></view>
            <text>开始排班</text>
          </button>
          <button class="proto-quick-pill green" @click="go('/pages/counselor/messages')">
            <view class="mini-icon bell"></view>
            <text>我的消息</text>
          </button>
          <button class="proto-quick-pill orange" @click="go('/pages/counselor/referrals')">
            <view class="mini-icon transfer"></view>
            <text>发起转介</text>
          </button>
        </view>

        <view class="proto-section">
          <view class="proto-section-head">
            <text class="proto-section-title">今日排班时间线</text>
            <text class="proto-section-date">{{ todayLabel }}</text>
          </view>
          <view class="proto-timeline">
            <view v-if="loading" class="proto-timeline-item">
              <view class="proto-timeline-dot muted"></view>
              <view class="proto-empty-slot">
                <text>正在读取今日预约...</text>
              </view>
            </view>
            <view
              v-for="item in todayAppointments"
              v-else-if="todayAppointments.length"
              :key="item.id"
              class="proto-timeline-item"
            >
              <view class="proto-timeline-dot blue"></view>
              <view class="proto-slot-card">
                <view>
                  <text class="proto-slot-time">{{ formatRange(item.schedule) }}</text>
                  <text class="proto-slot-name">{{ item.student?.name || "学生" }}（{{ item.type || "咨询" }}）</text>
                </view>
                <button class="proto-link" @click="goAppointmentDetail(item.id)">详情</button>
              </view>
            </view>
            <view v-else class="proto-timeline-item">
              <view class="proto-timeline-dot muted"></view>
              <view class="proto-empty-slot">
                <text>今日暂无预约</text>
              </view>
            </view>
          </view>
        </view>

        <view class="proto-task-section">
          <text class="proto-task-title">待办事项</text>
          <button class="proto-task-card" @click="go('/pages/counselor/risk-records')">
            <view class="proto-task-icon red">
              <image class="brand-mini-icon" mode="aspectFit" :src="BRAND_ASSETS.riskIcon" />
            </view>
            <view class="proto-task-body">
              <text class="proto-task-name">高风险评估待处理</text>
              <text class="proto-task-desc">{{ dashboard.riskCount || 0 }} 条风险记录需要关注</text>
            </view>
            <text class="proto-chevron">›</text>
          </button>
          <button class="proto-task-card" @click="go('/pages/counselor/appointments')">
            <view class="proto-task-icon orange">
              <view class="mini-icon search"></view>
            </view>
            <view class="proto-task-body">
              <text class="proto-task-name">待确认预约</text>
              <text class="proto-task-desc">{{ dashboard.pendingCount || 0 }} 条学生预约等待处理</text>
            </view>
            <text class="proto-chevron">›</text>
          </button>
          <button class="proto-task-card" @click="go('/pages/counselor/messages')">
            <view class="proto-task-icon blue">
              <view class="mini-icon transfer"></view>
            </view>
            <view class="proto-task-body">
              <text class="proto-task-name">预约相关消息</text>
              <text class="proto-task-desc">{{ unreadMessageCount }} 条未读消息</text>
            </view>
            <text class="proto-chevron">›</text>
          </button>
        </view>
      </scroll-view>
    </view>

    <view class="proto-tabbar">
      <button class="proto-tab active">
        <view class="mini-icon dashboard"></view>
        <text>工作台</text>
      </button>
      <button class="proto-tab" @click="go('/pages/counselor/appointments')">
        <view class="mini-icon calendar"></view>
        <text>预约</text>
      </button>
      <button class="proto-tab" @click="go('/pages/counselor/students')">
        <view class="mini-icon students"></view>
        <text>学生</text>
      </button>
      <button class="proto-tab" @click="go('/pages/counselor/profile')">
        <view class="mini-icon profile"></view>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCurrentUser } from "../../api/auth";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorDashboard } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const loading = ref(false);
const counselor = ref({});
const dashboard = ref({ todayAppointments: [], pendingCount: 0, riskCount: 0, messages: [] });
const layoutStyle = getLayoutVars();

const todayAppointments = computed(() => dashboard.value.todayAppointments || []);
const unreadMessageCount = computed(() => (dashboard.value.messages || []).filter((item) => !item.isRead).length);
const counselorName = computed(() => counselor.value?.name || "咨询师");
const counselorAvatar = computed(() => resolveApiAssetUrl(counselor.value?.avatar) || BRAND_ASSETS.defaultCounselorAvatar);
const riskMessage = computed(() => {
  const count = dashboard.value.riskCount || 0;
  return count ? `${count} 条高风险记录需要关注` : "暂无高风险提醒";
});
const todayLabel = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
});

onShow(() => {
  loadDashboard();
});

async function loadDashboard() {
  loading.value = true;
  try {
    const [me, data] = await Promise.all([getCurrentUser(), getCounselorDashboard()]);
    counselor.value = me?.user || {};
    dashboard.value = {
      todayAppointments: data?.todayAppointments || [],
      pendingCount: data?.pendingCount || 0,
      riskCount: data?.riskCount || 0,
      messages: data?.messages || []
    };
  } catch (error) {
    uni.showToast({ title: error.message || "工作台数据读取失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatRange(schedule) {
  if (!schedule) return "时间待确认";
  return `${formatTime(schedule.startAt)} - ${formatTime(schedule.endAt)}`;
}

function goAppointmentDetail(id) {
  goPage(`/pages/counselor/appointment-detail?id=${id}`);
}

function go(url) {
  goPage(url);
}
</script>

<style scoped>
.counselor-dashboard-proto {
  background: #f8fafc;
}

.proto-status {
  height: 80rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 48rpx 0;
  color: #111827;
  font-size: 24rpx;
  font-weight: 700;
}

.proto-status-icons {
  width: 104rpx;
  display: flex;
  justify-content: flex-end;
  gap: 10rpx;
  color: #111827;
}

.proto-status-icons .mini-icon {
  width: 22rpx;
  height: 22rpx;
}

.proto-counselor-header {
  min-height: 128rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
}

.proto-counselor-user {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.proto-counselor-avatar {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  border: 1rpx solid #f3f4f6;
  border-radius: 999rpx;
}

.fallback-avatar {
  background: #EFF6FF;
}

.proto-counselor-name {
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 800;
}

.proto-online-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 6rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-online-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 999rpx;
  background: #22c55e;
}

.proto-cog-button {
  width: 56rpx;
  height: 56rpx;
  display: grid;
  place-items: center;
  color: #9ca3af;
  background: transparent;
}

.proto-cog-button .mini-icon {
  width: 44rpx;
  height: 44rpx;
}

.proto-content {
  flex: 1;
  min-height: 0;
}

.proto-scroll {
  height: 100%;
  overflow-x: hidden;
}

.proto-dashboard-hero {
  position: relative;
  height: 188rpx;
  margin: 28rpx 40rpx 0;
  overflow: hidden;
  border-radius: 32rpx;
  background: #10232a;
  box-shadow: 0 16rpx 34rpx rgba(16,35,42,.14);
}

.proto-dashboard-hero-image,
.proto-dashboard-hero-mask {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.proto-dashboard-hero-mask {
  background: linear-gradient(90deg, rgba(16,35,42,.74), rgba(16,35,42,.28) 56%, rgba(16,35,42,.08));
}

.proto-dashboard-hero-copy {
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  align-content: center;
  gap: 8rpx;
  padding: 0 32rpx;
}

.proto-dashboard-hero-copy text:first-child {
  color: #fff;
  font-size: 34rpx;
  font-weight: 900;
}

.proto-dashboard-hero-copy text:last-child {
  color: rgba(255,255,255,.82);
  font-size: 22rpx;
  font-weight: 700;
}

.proto-risk-wrap {
  padding: 24rpx 40rpx 0;
}

.proto-risk-card {
  padding: 32rpx;
  border: 1rpx solid #fecaca;
  border-radius: 32rpx;
  background: linear-gradient(90deg, #fff1f2, #fee2e2);
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.05);
}

.proto-risk-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.proto-risk-icon {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #ef4444;
  background: #fee2e2;
}

.proto-risk-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 8rpx;
}

.proto-risk-title {
  color: #b91c1c;
  font-size: 24rpx;
  font-weight: 800;
}

.proto-risk-empty {
  color: #dc2626;
  font-size: 20rpx;
}

.proto-risk-close {
  width: 36rpx;
  height: 36rpx;
  flex: none;
  display: grid;
  place-items: center;
  color: #fca5a5;
  background: transparent;
}

.proto-risk-close .mini-icon {
  width: 32rpx;
  height: 32rpx;
}

.proto-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
  padding: 40rpx;
}

.proto-stat-card {
  min-height: 128rpx;
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.05);
}

.proto-stat-label {
  display: block;
  margin-bottom: 8rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-stat-line {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.proto-stat-value {
  color: #1f2937;
  font-size: 48rpx;
  line-height: 1;
  font-weight: 900;
}

.proto-stat-value.orange {
  color: #f97316;
}

.proto-stat-value.red {
  color: #ef4444;
}

.proto-stat-value.blue {
  color: #3b82f6;
}

.proto-stat-up {
  margin-bottom: 4rpx;
  color: #22c55e;
  font-size: 20rpx;
}

.proto-orange-dot {
  width: 16rpx;
  height: 16rpx;
  margin-bottom: 8rpx;
  border-radius: 999rpx;
  background: #f97316;
}

.proto-quick-actions {
  display: flex;
  gap: 24rpx;
  padding: 0 40rpx 44rpx;
  overflow-x: hidden;
}

.proto-quick-pill {
  min-width: 0;
  min-height: 88rpx;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 0 18rpx;
  border: 1rpx solid transparent;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.proto-quick-pill .mini-icon {
  width: 34rpx;
  height: 34rpx;
}

.proto-quick-pill.blue {
  color: #2563eb;
  border-color: #dbeafe;
  background: #eff6ff;
}

.proto-quick-pill.green {
  color: #16a34a;
  border-color: #dcfce7;
  background: #f0fdf4;
}

.proto-quick-pill.orange {
  color: #f97316;
  border-color: #ffedd5;
  background: #fff7ed;
}

.proto-section {
  padding: 0 40rpx 48rpx;
}

.proto-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.proto-section-title,
.proto-task-title {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 800;
}

.proto-section-date {
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-timeline {
  position: relative;
  display: grid;
  gap: 24rpx;
}

.proto-timeline::before {
  content: "";
  position: absolute;
  left: 30rpx;
  top: 16rpx;
  bottom: 16rpx;
  width: 2rpx;
  background: #f3f4f6;
}

.proto-timeline-item {
  position: relative;
  padding-left: 64rpx;
}

.proto-timeline-dot {
  position: absolute;
  left: 22rpx;
  top: 16rpx;
  z-index: 2;
  width: 16rpx;
  height: 16rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
}

.proto-timeline-dot.blue {
  background: #3b82f6;
}

.proto-timeline-dot.muted {
  background: #e5e7eb;
}

.proto-slot-card {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  background: #fff;
}

.proto-slot-time {
  display: block;
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-slot-name {
  display: block;
  margin-top: 6rpx;
  color: #1f2937;
  font-size: 24rpx;
  font-weight: 800;
}

.proto-link {
  color: #3b82f6;
  font-size: 24rpx;
  font-weight: 700;
  background: transparent;
}

.proto-risk-tag {
  flex: none;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  color: #ef4444;
  background: #fef2f2;
  font-size: 16rpx;
}

.proto-empty-slot {
  min-height: 76rpx;
  display: grid;
  place-items: center;
  border: 1rpx dashed #e5e7eb;
  border-radius: 24rpx;
  color: #9ca3af;
  background: #f9fafb;
  font-size: 20rpx;
  font-style: italic;
}

.proto-task-section {
  display: grid;
  gap: 24rpx;
  padding: 0 40rpx 176rpx;
}

.proto-task-card {
  min-height: 112rpx;
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 28rpx 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.05);
  text-align: left;
}

.proto-task-icon {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 24rpx;
}

.proto-task-icon.red {
  color: #ef4444;
  background: #fef2f2;
}

.proto-task-icon.orange {
  color: #f97316;
  background: #fff7ed;
}

.proto-task-icon.blue {
  color: #3b82f6;
  background: #eff6ff;
}

.proto-task-icon .mini-icon {
  width: 40rpx;
  height: 40rpx;
}

.proto-task-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 6rpx;
}

.proto-task-name {
  color: #1f2937;
  font-size: 24rpx;
  font-weight: 800;
}

.proto-task-desc {
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-chevron {
  color: #d1d5db;
  font-size: 36rpx;
}

.proto-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 32rpx 8rpx;
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.proto-tab {
  min-width: 112rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 600;
  background: transparent;
}

.proto-tab.active {
  color: #4A90D9;
}

.proto-tab .mini-icon {
  width: 44rpx;
  height: 44rpx;
}
</style>
