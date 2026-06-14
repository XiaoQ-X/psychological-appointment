<template>
  <view class="mobile-container sp-page student-appointment-detail-page" :style="layoutStyle">
    <view class="sp-status"><text>09:41</text><view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view></view>
    <view class="sp-header">
      <button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">预约详情</text>
      <view class="sp-header-spacer"></view>
    </view>
    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="detail-stack">
          <view v-if="loading" class="detail-card loading-card">
            <text class="sp-text">预约详情加载中，请稍候</text>
          </view>
          <view v-else-if="errorText" class="detail-card error-card">
            <text class="sp-text">{{ errorText }}</text>
            <button class="detail-link" @click="go('/pages/student/appointments')">返回我的预约</button>
          </view>
          <view v-if="!loading && !errorText && hasDetail" :class="['status-card', statusView.tone]">
            <view class="status-icon">{{ statusView.icon }}</view>
            <view>
              <text class="status-title">{{ statusView.title }}</text>
              <text class="status-desc">{{ statusView.desc }}</text>
            </view>
          </view>
          <view v-else-if="!loading && !errorText && !hasDetail" class="detail-card error-card">
            <text class="sp-text">预约详情暂无数据</text>
            <button class="detail-link" @click="go('/pages/student/appointments')">返回我的预约</button>
          </view>
          <view v-if="!loading && !errorText && hasDetail" class="detail-card">
            <view class="detail-card-title"><view class="mini-icon document"></view><text>预约信息</text></view>
            <view class="sp-row teacher-row">
              <image class="sp-avatar round" mode="aspectFill" :src="detail.avatar" />
              <view>
                <text class="sp-title">{{ detail.counselorName }}</text>
                <text class="sp-muted">{{ detail.counselorTitle }}</text>
              </view>
            </view>
            <view class="sp-info-list section-gap">
              <view class="sp-info-row"><text>咨询类型</text><text class="sp-info-value">常规咨询</text></view>
              <view class="sp-info-row"><text>预约时间</text><text class="sp-info-value">{{ detail.time }}</text></view>
              <view class="sp-info-row"><text>咨询地点</text><text class="sp-info-value">{{ detail.place }}</text></view>
              <view class="sp-info-row"><text>咨询方式</text><text class="sp-info-value">{{ detail.typeText }}</text></view>
              <view class="sp-info-row"><text>提交时间</text><text class="sp-info-value">{{ detail.createdAt }}</text></view>
              <view v-if="activeStatus === 'confirmed'" class="sp-info-row"><text>确认时间</text><text class="sp-info-value">{{ detail.updatedAt }}</text></view>
              <view v-if="activeStatus === 'cancelled'" class="sp-info-row"><text>取消时间</text><text class="sp-info-value">{{ detail.updatedAt }}</text></view>
              <view v-if="activeStatus === 'completed'" class="sp-info-row"><text>完成时间</text><text class="sp-info-value">{{ detail.updatedAt }}</text></view>
            </view>
          </view>
          <view v-if="!loading && !errorText && hasDetail" class="detail-card">
            <view class="detail-card-title"><view class="mini-icon message"></view><text>主诉摘要</text></view>
            <text class="sp-text section-gap">{{ detail.concern }}</text>
            <view class="section-gap"><text class="sp-tag success">风险等级：{{ detail.riskLevel }}</text></view>
          </view>
          <view v-if="!loading && !errorText && hasDetail && activeStatus === 'confirmed'" class="detail-card state-info-card confirmed">
            <view class="detail-card-title"><view class="mini-icon check"></view><text>确认信息</text></view>
            <text class="sp-text section-gap">老师已确认本次预约，请按时到达咨询地点。如需调整时间，请提前申请改期或取消。</text>
          </view>
          <view v-if="!loading && !errorText && hasDetail && activeStatus === 'cancelled'" class="detail-card state-info-card cancelled">
            <view class="detail-card-title"><view class="mini-icon info"></view><text>取消信息</text></view>
            <text class="sp-text section-gap">取消原因：{{ detail.cancelReason }}</text>
            <text class="sp-muted">取消后原时段将释放，可重新发起预约。</text>
          </view>
          <view v-if="!loading && !errorText && hasDetail && activeStatus === 'completed'" class="detail-card state-info-card completed">
            <view class="detail-card-title"><view class="mini-icon check"></view><text>完成信息</text></view>
            <text class="sp-text section-gap">本次咨询已完成，如仍需要支持，可以再次预约或提交咨询评价。</text>
          </view>
          <view v-if="!loading && !errorText && hasDetail" class="detail-card rule-card">
            <view class="detail-card-title"><view class="mini-icon info"></view><text>注意事项与取消规则</text></view>
            <view class="rule-list">
              <text>请提前5分钟到达心理中心签到</text>
              <text>预约时间前2小时以上可自行取消</text>
              <text>30天内3次未到将限制预约30天</text>
              <text>如需更改时间，请先取消后重新预约</text>
            </view>
          </view>
          <view v-if="!loading && !errorText && hasDetail" class="detail-card">
            <view class="detail-card-title"><view class="mini-icon clock"></view><text>操作日志</text></view>
            <view v-for="log in operationLogs" :key="log.text" class="log-item">
              <view class="log-dot"></view>
              <view>
                <text>{{ log.text }}</text>
                <text>{{ log.time }}</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    <view v-if="hasDetail && !loading && !errorText" class="sp-bottom-actions above-tabbar">
      <template v-if="activeStatus === 'pending'">
        <button class="sp-secondary warning-action" :loading="cancelling" :disabled="cancelling" @click="showCancelModal = true">取消预约</button>
        <button class="detail-link" @click="go('/pages/student/emergency')">查看紧急帮助</button>
      </template>
      <template v-else-if="activeStatus === 'confirmed'">
        <button class="sp-secondary warning-action" :loading="cancelling" :disabled="cancelling" @click="showCancelModal = true">取消预约</button>
        <button class="detail-link" @click="go(`/pages/student/reschedule?id=${appointmentId}`)">申请改期</button>
      </template>
      <template v-else-if="activeStatus === 'cancelled'">
        <button class="sp-primary" @click="go('/pages/student/counselors')">重新预约</button>
      </template>
      <template v-else-if="activeStatus === 'completed'">
        <button class="sp-primary" @click="go(`/pages/student/feedback?id=${appointmentId}`)">去评价</button>
        <button class="detail-link" @click="go('/pages/student/counselors')">再次预约</button>
      </template>
      <template v-else>
        <button class="sp-primary" @click="go('/pages/student/counselors')">重新预约</button>
        <button class="detail-link" @click="go('/pages/student/emergency')">查看紧急帮助</button>
      </template>
    </view>
    <view v-if="showCancelModal" class="cancel-modal-mask">
      <view class="cancel-modal">
        <view class="cancel-modal-icon">!</view>
        <text class="cancel-modal-title">确认取消预约？</text>
        <text class="cancel-modal-desc">取消后该时段将释放，如需重新预约请选择其他时间。</text>
        <textarea v-model="cancelReason" class="cancel-reason" placeholder="请填写取消原因..." />
        <view class="cancel-modal-actions">
          <button class="cancel-confirm" :loading="cancelling" :disabled="cancelling" @click="confirmCancel">确认取消</button>
          <button class="cancel-keep" @click="showCancelModal = false">暂不取消</button>
        </view>
      </view>
    </view>
    <view class="sp-tabbar">
      <button class="sp-tab" @click="goHome"><view class="mini-icon home"></view><text>首页</text></button>
      <button class="sp-tab active" @click="go('/pages/student/appointments')"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab" @click="go('/pages/student/articles')"><view class="mini-icon newspaper"></view><text>资讯</text></button>
      <button class="sp-tab" @click="go('/pages/student/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { cancelAppointment, getAppointmentDetail } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const layoutStyle = getLayoutVars();

const appointmentId = ref("");
const errorText = ref("");
const loading = ref(false);
const activeStatus = ref("pending");
const showCancelModal = ref(false);
const cancelReason = ref("");
const cancelling = ref(false);
const appointment = ref(null);

const statusMap = {
  pending: {
    icon: "⏳",
    title: "正在等待老师确认",
    desc: "请耐心等待，确认结果将通过消息通知你",
    tone: "pending"
  },
  confirmed: {
    icon: "✓",
    title: "预约已确认",
    desc: "请准时到达咨询地点，咨询前可在消息中心查看提醒",
    tone: "confirmed"
  },
  cancelled: {
    icon: "×",
    title: "预约已取消",
    desc: "本次预约已取消，你可以重新选择咨询师和时间",
    tone: "cancelled"
  },
  rejected: {
    icon: "×",
    title: "预约未通过",
    desc: "本次预约未通过，可重新选择其他咨询师或时段",
    tone: "cancelled"
  },
  no_show: {
    icon: "!",
    title: "已标记未到",
    desc: "如需继续咨询，请重新提交预约申请",
    tone: "cancelled"
  },
  in_progress: {
    icon: "✓",
    title: "咨询进行中",
    desc: "本次预约已开始，请按咨询师引导完成咨询",
    tone: "confirmed"
  },
  completed: {
    icon: "✓",
    title: "咨询已完成",
    desc: "感谢你的配合，如有需要可以继续预约或提交评价",
    tone: "completed"
  }
};

const statusView = computed(() => statusMap[activeStatus.value] || statusMap.pending);

const hasDetail = computed(() => Boolean(appointment.value && typeof appointment.value === "object" && appointment.value.id));
const detail = computed(() => normalizeAppointmentDetail(appointment.value));

const operationLogs = computed(() => {
  const item = detail.value;
  const logs = [{ text: "学生提交预约", time: item.createdAt }];
  if (["confirmed", "completed"].includes(activeStatus.value)) {
    logs.push({ text: "老师确认预约", time: item.updatedAt });
  }
  if (activeStatus.value === "cancelled") {
    logs.push({ text: "学生取消预约", time: item.updatedAt });
  }
  if (activeStatus.value === "completed") {
    logs.push({ text: "咨询完成", time: item.updatedAt });
  }
  return logs;
});

onLoad((query = {}) => {
  appointmentId.value = query.id || "";
  if (appointmentId.value) {
    loadAppointmentDetail();
  } else {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    if (query.status && statusMap[query.status]) {
      activeStatus.value = query.status;
    }
  }
});

async function loadAppointmentDetail() {
  if (!appointmentId.value) {
    appointment.value = null;
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    return;
  }
  loading.value = true;
  errorText.value = "";
  appointment.value = null;
  try {
    const result = await getAppointmentDetail(appointmentId.value);
    if (!result || typeof result !== "object" || !result.id) {
      errorText.value = "预约详情暂无数据";
      return;
    }
    appointment.value = result;
    activeStatus.value = normalizeStatus(result.status);
  } catch (error) {
    errorText.value = error.message || "预约详情加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "预约详情加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function confirmCancel() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    showCancelModal.value = false;
    cancelReason.value = "";
    return;
  }
  cancelling.value = true;
  try {
    await cancelAppointment(appointmentId.value, { reason: cancelReason.value || "学生主动取消" });
    showCancelModal.value = false;
    cancelReason.value = "";
    uni.showToast({ title: "已取消预约", icon: "none" });
    await loadAppointmentDetail();
  } catch (error) {
    uni.showToast({ title: error.message || "取消预约失败", icon: "none" });
  } finally {
    cancelling.value = false;
  }
}

function normalizeAppointmentDetail(raw = {}) {
  const item = raw && typeof raw === "object" ? raw : {};
  const counselor = item.counselor && typeof item.counselor === "object" ? item.counselor : {};
  const schedule = item.schedule && typeof item.schedule === "object" ? item.schedule : {};
  const room = item.room && typeof item.room === "object" ? item.room : {};
  const campus = item.campus && typeof item.campus === "object" ? item.campus : {};
  const counselorName = safeText(counselor.name || item.counselorName, "咨询师待确认");
  const typeText = item.type === "online" ? "线上咨询" : "线下咨询";
  const placeText = item.type === "online"
    ? safeText(item.meetingUrl || item.place, "线上咨询")
    : safeText(room.name || campus.name || item.place, "地点待确认");

  return {
    counselorName,
    counselorTitle: safeText(counselor.title || item.counselorTitle, "心理中心专职咨询师"),
    avatar: resolveApiAssetUrl(counselor.avatar || item.counselorAvatar) || BRAND_ASSETS.defaultCounselorAvatar,
    avatarText: counselorName.slice(0, 1) || "咨",
    typeText,
    time: safeText(formatRange(schedule.startAt || item.startAt, schedule.endAt || item.endAt) || item.time, "时间待确认"),
    place: placeText,
    createdAt: safeText(formatDateTime(item.createdAt), "时间待确认"),
    updatedAt: safeText(formatDateTime(item.updatedAt), "时间待确认"),
    concern: safeText(item.concern || item.reason || item.description, "暂未填写"),
    riskLevel: safeText(item.riskLevel || item.riskLevelText || item.riskAssessment?.level, "暂未评估"),
    cancelReason: safeText(item.cancelReason || cancelReason.value, "学生主动取消")
  };
}

function safeText(value, fallback) {
  const text = String(value ?? "").trim();
  if (!text || /^(undefined|null|NaN)$/i.test(text)) return fallback;
  return text;
}

function normalizeAppointment(item = {}) {
  const counselorName = item.counselor?.name || "咨询师";
  return {
    counselorName,
    counselorTitle: item.counselor?.title || "心理中心专职咨询师",
    avatar: resolveApiAssetUrl(item.counselor?.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
    avatarText: counselorName.slice(0, 1),
    typeText: item.type === "online" ? "线上咨询" : "线下咨询",
    time: formatRange(item.schedule?.startAt, item.schedule?.endAt) || "时间待确认",
    place: item.type === "online" ? "线上视频咨询" : (item.room?.name || item.campus?.name || "心理中心咨询室"),
    createdAt: formatDateTime(item.createdAt) || "提交时间待确认",
    updatedAt: formatDateTime(item.updatedAt) || "处理时间待确认",
    concern: item.concern || "暂未填写主诉摘要",
    riskLevel: item.riskLevel || "低",
    cancelReason: item.cancelReason || cancelReason.value || "学生主动取消"
  };
}

function normalizeStatus(status) {
  if (["pending", "confirmed", "cancelled", "completed", "rejected", "no_show", "in_progress"].includes(status)) return status;
  return "pending";
}

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "";
  const date = start.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : `-${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date} ${startText}${endText}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function go(url) { goPage(url); }
function goHome() { goPrimaryPage("/pages/student/home"); }
function back() { safeBackStudent("/pages/student/appointments"); }
</script>

<style scoped>
.detail-stack { display: grid; gap: 24rpx; padding: 32rpx 40rpx 246rpx; }
.status-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 40rpx;
  border-radius: 32rpx;
  color: #fff;
  background: #F5A623;
  box-shadow: 0 8rpx 18rpx rgba(245,158,11,.2);
}
.status-card.pending {
  background: #F5A623;
  box-shadow: 0 8rpx 18rpx rgba(245,158,11,.2);
}
.status-card.confirmed {
  background: #4A90D9;
  box-shadow: 0 8rpx 18rpx rgba(74,144,217,.2);
}
.status-card.cancelled {
  background: #9ca3af;
  box-shadow: 0 8rpx 18rpx rgba(107,114,128,.16);
}
.status-card.completed {
  background: #10B981;
  box-shadow: 0 8rpx 18rpx rgba(16,185,129,.18);
}
.status-icon {
  width: 64rpx;
  height: 64rpx;
  display: grid;
  place-items: center;
  flex: none;
  font-size: 42rpx;
}
.status-title { font-size: 32rpx; font-weight: 900; }
.status-desc { display: block; margin-top: 4rpx; color: rgba(255,255,255,.85); font-size: 22rpx; }
.detail-card {
  display: grid;
  gap: 24rpx;
  padding: 36rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(15,23,42,.05);
}

.error-card {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.error-card .detail-link {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: #fff;
}

.detail-card-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #1f2937;
  font-size: 26rpx;
  font-weight: 900;
}
.detail-card-title .mini-icon {
  width: 32rpx;
  height: 32rpx;
  color: #4A90D9;
}

.mini-icon.document,
.mini-icon.message,
.mini-icon.info,
.mini-icon.check {
  position: relative;
}

.mini-icon.document::before {
  content: "";
  position: absolute;
  left: 7rpx;
  top: 4rpx;
  width: 18rpx;
  height: 24rpx;
  border: 3rpx solid currentColor;
  border-radius: 4rpx;
}

.mini-icon.document::after {
  content: "";
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  width: 12rpx;
  height: 3rpx;
  background: currentColor;
  box-shadow: 0 7rpx 0 currentColor;
}

.mini-icon.message::before {
  content: "";
  position: absolute;
  left: 3rpx;
  top: 6rpx;
  width: 26rpx;
  height: 18rpx;
  border: 3rpx solid currentColor;
  border-radius: 7rpx;
}

.mini-icon.message::after {
  content: "";
  position: absolute;
  left: 10rpx;
  top: 21rpx;
  width: 8rpx;
  height: 8rpx;
  border-left: 3rpx solid currentColor;
  border-bottom: 3rpx solid currentColor;
  transform: rotate(-25deg);
}

.mini-icon.info::before {
  content: "!";
  position: absolute;
  inset: 2rpx;
  display: grid;
  place-items: center;
  border: 3rpx solid currentColor;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 900;
}

.mini-icon.check::before {
  content: "";
  position: absolute;
  left: 5rpx;
  top: 4rpx;
  width: 22rpx;
  height: 22rpx;
  border: 3rpx solid currentColor;
  border-radius: 999rpx;
}

.mini-icon.check::after {
  content: "";
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  width: 12rpx;
  height: 7rpx;
  border-left: 3rpx solid currentColor;
  border-bottom: 3rpx solid currentColor;
  transform: rotate(-45deg);
}

.teacher-row { gap: 24rpx; margin-top: 24rpx; padding-bottom: 24rpx; border-bottom: 1rpx solid #f3f4f6; }
.section-gap { margin-top: 24rpx; }
.state-info-card.confirmed {
  border-color: #dbeafe;
}
.state-info-card.confirmed .detail-card-title,
.state-info-card.confirmed .mini-icon {
  color: #4A90D9;
}
.state-info-card.cancelled {
  border-color: #e5e7eb;
}
.state-info-card.cancelled .detail-card-title,
.state-info-card.cancelled .mini-icon {
  color: #6b7280;
}
.state-info-card.completed {
  border-color: #bbf7d0;
}
.state-info-card.completed .detail-card-title,
.state-info-card.completed .mini-icon {
  color: #10B981;
}
.rule-card .detail-card-title .mini-icon {
  color: #F5A623;
}
.rule-list {
  display: grid;
  gap: 18rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.5;
}
.rule-list text {
  position: relative;
  padding-left: 26rpx;
}
.rule-list text::before {
  content: "";
  position: absolute;
  left: 4rpx;
  top: 15rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #d1d5db;
}
.log-item {
  display: flex;
  align-items: flex-start;
  gap: 18rpx;
  color: #6b7280;
  font-size: 24rpx;
}
.log-dot {
  width: 16rpx;
  height: 16rpx;
  flex: none;
  margin-top: 10rpx;
  border-radius: 999rpx;
  background: #4A90D9;
}
.log-item text:first-child {
  display: block;
  color: #374151;
  font-weight: 700;
}
.log-item text:last-child {
  display: block;
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 20rpx;
}
.sp-bottom-actions {
  bottom: 128rpx;
}
.disabled-action {
  color: #9ca3af;
  background: #f3f4f6;
}
.warning-action {
  color: #f59e0b;
  border-color: #fed7aa;
  background: #fff7ed;
}
.detail-link {
  height: 42rpx;
  color: #4A90D9;
  font-size: 24rpx;
  font-weight: 800;
  text-align: center;
}
.cancel-modal-mask {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: rgba(15,23,42,.42);
}
.cancel-modal {
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 18rpx;
  padding: 44rpx 36rpx 36rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 24rpx 60rpx rgba(15,23,42,.18);
}
.cancel-modal-icon {
  width: 88rpx;
  height: 88rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #F5A623;
  background: #fff7ed;
  font-size: 42rpx;
  font-weight: 900;
}
.cancel-modal-title {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 900;
}
.cancel-modal-desc {
  color: #9ca3af;
  font-size: 22rpx;
  line-height: 1.5;
  text-align: center;
}
.cancel-reason {
  width: 100%;
  height: 150rpx;
  padding: 22rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  color: #1f2937;
  background: #f9fafb;
  font-size: 24rpx;
  line-height: 1.45;
}
.cancel-modal-actions {
  width: 100%;
  display: grid;
  gap: 18rpx;
  margin-top: 4rpx;
}
.cancel-confirm,
.cancel-keep {
  height: 84rpx;
  border-radius: 24rpx;
  font-size: 26rpx;
  font-weight: 900;
}
.cancel-confirm {
  color: #fff;
  background: #EF4444;
}
.cancel-keep {
  color: #6b7280;
  background: #f3f4f6;
}
/* 上线前自适应收口：详情、弹窗和底部操作区长文本不遮挡。 */
text,
button,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.detail-stack {
  padding-bottom: calc(246rpx + env(safe-area-inset-bottom));
}

.student-appointment-detail-page .sp-content {
  margin-bottom: calc(286rpx + env(safe-area-inset-bottom));
}

.sp-bottom-actions {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.cancel-reason {
  box-sizing: border-box;
}
</style>
