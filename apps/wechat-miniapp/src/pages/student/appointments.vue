<template>
  <view class="mobile-container sp-page">
    <view class="sp-status"><text>09:41</text><view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view></view>
    <view class="sp-header">
      <button class="sp-back" @click="go('/pages/student/profile')"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">我的预约</text>
      <view class="sp-header-spacer"></view>
    </view>
    <view class="appointment-tabs">
      <button v-for="tab in tabs" :key="tab.label" :class="['appointment-tab', { active: tab.value === activeTab }]" @click="selectTab(tab.value)">{{ tab.label }}</button>
    </view>
    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="appointment-stack">
          <view v-if="loading" class="student-appointment-card faded">
            <text class="appointment-name">预约记录加载中...</text>
            <text class="appointment-type">请稍候</text>
          </view>
          <view v-else-if="!appointments.length" class="student-appointment-card faded">
            <text class="appointment-name">暂无预约</text>
            <text class="appointment-type">提交预约后会显示在这里</text>
          </view>
          <block v-else>
            <view v-for="item in appointments" :key="item.id" :class="['student-appointment-card', { faded: item.completed }]">
              <view class="appointment-head">
                <view class="appointment-teacher">
                  <image class="appointment-avatar" mode="aspectFill" :src="item.avatar" />
                  <view>
                    <text class="appointment-name">{{ item.name }}</text>
                    <text class="appointment-type">{{ item.type }}</text>
                  </view>
                </view>
                <text :class="['appointment-status', item.tagClass]">{{ item.status }}</text>
              </view>
              <view class="appointment-info">
                <view class="sp-row info-line"><view class="mini-icon calendar"></view><text>{{ item.time }}</text></view>
                <view class="sp-row info-line"><view class="mini-icon location"></view><text>{{ item.place }}</text></view>
              </view>
              <view class="appointment-actions">
                <button v-for="action in item.actions" :key="action.text" :class="['appointment-action', action.primary ? 'primary' : 'ghost']" @click="go(action.url)">
                  {{ action.text }}
                </button>
              </view>
            </view>
          </block>
        </view>
      </scroll-view>
    </view>
    <view class="sp-tabbar">
      <button class="sp-tab" @click="goHome"><view class="mini-icon home"></view><text>首页</text></button>
      <button class="sp-tab active"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab" @click="go('/pages/student/articles')"><view class="mini-icon newspaper"></view><text>资讯</text></button>
      <button class="sp-tab" @click="go('/pages/student/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getAppointments } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const tabs = [
  { label: "全部", value: "" },
  { label: "待确认", value: "pending" },
  { label: "已确认", value: "confirmed" },
  { label: "进行中", value: "in_progress" },
  { label: "已完成", value: "completed" },
  { label: "已取消", value: "cancelled" },
  { label: "已拒绝", value: "rejected" }
];
const activeTab = ref("");
const loading = ref(false);
const appointments = ref([]);

onShow(() => {
  loadAppointments();
});

function selectTab(value) {
  activeTab.value = value;
  loadAppointments();
}

async function loadAppointments() {
  loading.value = true;
  try {
    const list = await getAppointments(activeTab.value ? { status: activeTab.value } : {});
    appointments.value = (Array.isArray(list) ? list : []).map(normalizeAppointment);
  } catch (error) {
    appointments.value = [];
    uni.showToast({ title: error.message || "预约列表加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeAppointment(item = {}) {
  const status = normalizeStatus(item.status);
  const id = item.id || "";
  return {
    id,
    name: item.counselor?.name || "咨询师",
    type: item.type === "online" ? "线上视频" : "线下咨询",
    status: statusText(status),
    tagClass: status,
    time: formatRange(item.schedule?.startAt, item.schedule?.endAt),
    place: item.type === "online" ? "视频链接将在咨询前10分钟开启" : (item.room?.name || item.campus?.name || "心理中心咨询室"),
    avatar: resolveApiAssetUrl(item.counselor?.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
    initial: String(item.counselor?.name || "咨").slice(0, 1),
    completed: status === "completed",
    actions: buildActions(id, status)
  };
}

function buildActions(id, status) {
  const detailUrl = `/pages/student/appointment-detail?id=${id}`;
  if (status === "completed") return [{ text: "去评价", url: `/pages/student/feedback?id=${id}`, primary: true }];
  if (status === "in_progress") return [{ text: "查看详情", url: detailUrl, primary: true }];
  if (status === "confirmed") return [{ text: "申请改期", url: `/pages/student/reschedule?id=${id}` }, { text: "查看详情", url: detailUrl, primary: true }];
  if (status === "cancelled") return [{ text: "重新预约", url: "/pages/student/counselors", primary: true }];
  if (status === "rejected") return [{ text: "重新预约", url: "/pages/student/counselors", primary: true }];
  return [{ text: "取消预约", url: detailUrl }, { text: "查看详情", url: detailUrl, primary: true }];
}

function normalizeStatus(status) {
  if (["pending", "confirmed", "in_progress", "cancelled", "completed", "rejected", "no_show"].includes(status)) return status;
  return "pending";
}

function statusText(status) {
  return { pending: "待确认", confirmed: "已确认", in_progress: "进行中", cancelled: "已取消", completed: "已完成", rejected: "已拒绝", no_show: "未到" }[status] || "待确认";
}

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "时间待确认";
  const date = start.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : ` - ${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date} ${startText}${endText}`;
}

function go(url) { goPage(url); }
function goHome() { goPrimaryPage("/pages/student/home"); }
</script>

<style scoped>
.appointment-tabs {
  height: 88rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 0 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
  background: #fff;
  overflow: hidden;
}

.appointment-tab {
  position: relative;
  flex: none;
  height: 88rpx;
  color: #9ca3af;
  font-size: 26rpx;
  font-weight: 700;
}

.appointment-tab.active {
  color: #4A90D9;
}

.appointment-tab.active::after {
  content: "";
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: #4A90D9;
}

.appointment-stack {
  display: grid;
  gap: 24rpx;
  padding: 32rpx 40rpx 148rpx;
}

.student-appointment-card {
  display: grid;
  gap: 26rpx;
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(15,23,42,.05);
}

.student-appointment-card.faded {
  opacity: .62;
}

.appointment-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.appointment-teacher {
  display: flex;
  align-items: center;
  gap: 20rpx;
  min-width: 0;
}

.appointment-avatar {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  border-radius: 999rpx;
  background: #EBF3FC;
}

.fallback-avatar {
  display: grid;
  place-items: center;
  color: #4A90D9;
  font-weight: 900;
}

.appointment-name {
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.appointment-type {
  display: block;
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.appointment-status {
  flex: none;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 800;
}

.appointment-status.pending {
  color: #f59e0b;
  background: #fff7ed;
}

.appointment-status.confirmed,
.appointment-status.in_progress,
.appointment-status.completed {
  color: #10B981;
  background: #ecfdf5;
}

.appointment-status.cancelled,
.appointment-status.rejected,
.appointment-status.no_show {
  color: #6b7280;
  background: #f3f4f6;
}

.appointment-info {
  display: grid;
  gap: 14rpx;
}

.info-line {
  gap: 12rpx;
  color: #6b7280;
  font-size: 22rpx;
}

.info-line .mini-icon {
  width: 28rpx;
  height: 28rpx;
  color: #9ca3af;
}

.mini-icon.location {
  position: relative;
}

.mini-icon.location::before {
  content: "";
  position: absolute;
  left: 7rpx;
  top: 2rpx;
  width: 14rpx;
  height: 18rpx;
  border: 3rpx solid currentColor;
  border-radius: 14rpx 14rpx 14rpx 2rpx;
  transform: rotate(-45deg);
}

.mini-icon.location::after {
  content: "";
  position: absolute;
  left: 12rpx;
  top: 8rpx;
  width: 5rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: currentColor;
}

.appointment-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.appointment-action {
  height: 64rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 900;
}

.appointment-action.ghost {
  border: 1rpx solid #f3f4f6;
  color: #9ca3af;
  background: #fff;
}

.appointment-action.primary {
  color: #1f2937;
  background: #f9fafb;
}
/* 上线前自适应收口：预约列表长姓名、地点和状态不撑破卡片。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
