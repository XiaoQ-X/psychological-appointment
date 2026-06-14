<template>
  <view class="mobile-container sp-page counselor-detail-page" :style="layoutStyle">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header center">
      <button class="sp-back" @click="back">
        <view class="mini-icon chevron-left"></view>
      </button>
      <text class="sp-header-title">预约详情</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="proto-stack detail-stack">
          <view class="status-hero waiting">
            <view>
              <text class="status-title">{{ statusText(appointment.status) }}</text>
              <text class="status-desc">{{ statusDesc(appointment.status) }}</text>
            </view>
            <text class="status-pill">{{ statusPill(appointment.status) }}</text>
          </view>

          <view v-if="loading" class="proto-card section-card">
            <text class="paragraph">正在读取预约详情...</text>
          </view>

          <view v-else-if="errorText" class="proto-card section-card error-card">
            <text class="paragraph">{{ errorText }}</text>
            <button class="error-return-btn" @click="go('/pages/counselor/appointments')">返回预约列表</button>
          </view>

          <template v-else>
            <view class="proto-card student-card">
              <view class="student-head">
                <image class="student-avatar student-avatar-image" mode="aspectFill" :src="studentAvatar" />
                <view class="student-info">
                  <text class="student-name">{{ appointment.student?.name || "学生" }}</text>
                  <text class="student-meta">{{ studentMeta }}</text>
                </view>
                <text class="risk-tag low">风险待评估</text>
              </view>
              <view class="info-grid">
                <view>
                  <text class="grid-label">预约时间</text>
                  <text class="grid-value">{{ formatDateTimeRange(appointment.schedule) }}</text>
                </view>
                <view>
                  <text class="grid-label">咨询类型</text>
                  <text class="grid-value">{{ appointment.type || "心理咨询" }}</text>
                </view>
                <view>
                  <text class="grid-label">咨询方式</text>
                  <text class="grid-value">{{ appointment.room ? "线下咨询" : "方式待确认" }}</text>
                </view>
                <view>
                  <text class="grid-label">咨询室</text>
                  <text class="grid-value">{{ appointment.room?.name || "待分配" }}</text>
                </view>
              </view>
            </view>

            <view class="proto-card section-card">
              <view class="section-title-row">
                <text class="section-title">主诉摘要</text>
                <text class="risk-tag low">学生提交</text>
              </view>
              <text class="paragraph">{{ appointment.concern || "学生暂未填写详细主诉。" }}</text>
              <view class="warm-note">
                {{ appointment.consentAccepted ? "学生已完成预约前知情同意。" : "学生知情同意状态待确认。" }}
              </view>
            </view>

            <view class="proto-card section-card">
              <text class="section-title">处理记录</text>
              <view class="timeline">
                <view class="timeline-item active">
                  <text class="timeline-dot"></text>
                  <view>
                    <text class="timeline-title">学生提交预约申请</text>
                    <text class="timeline-time">{{ formatFullTime(appointment.createdAt) }}</text>
                  </view>
                </view>
                <view class="timeline-item" :class="{ active: appointment.status !== 'pending' }">
                  <text class="timeline-dot"></text>
                  <view>
                    <text class="timeline-title">{{ statusTimelineTitle }}</text>
                    <text class="timeline-time">{{ formatFullTime(appointment.updatedAt) }}</text>
                  </view>
                </view>
                <view v-if="appointment.completedAt" class="timeline-item active">
                  <text class="timeline-dot"></text>
                  <view>
                    <text class="timeline-title">咨询已完成</text>
                    <text class="timeline-time">{{ formatFullTime(appointment.completedAt) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <view class="bottom-space"></view>
        </view>
      </scroll-view>
    </view>

    <view v-if="!loading && !errorText" class="fixed-actions">
      <button class="secondary-btn" :class="{ disabled: secondaryDisabled }" :disabled="actionLoading || secondaryDisabled" @click="handleSecondary">{{ secondaryActionText }}</button>
      <button class="primary-btn" :class="{ disabled: primaryDisabled }" :disabled="actionLoading || primaryDisabled" @click="handlePrimary">{{ primaryActionText }}</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  checkinAppointment,
  completeAppointment,
  confirmAppointment,
  getCounselorAppointment,
  rejectAppointment
} from "../../api/counselor";
import { resolveApiAssetUrl } from "../../api/client";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, safeBackCounselor } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const appointmentId = ref("");
const errorText = ref("");
const appointment = ref({});
const loading = ref(false);
const actionLoading = ref(false);
const layoutStyle = getLayoutVars();

const studentInitial = computed(() => (appointment.value.student?.name || "学").slice(0, 1));
const studentAvatar = computed(() => resolveApiAssetUrl(appointment.value.student?.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const studentMeta = computed(() => {
  const student = appointment.value.student || {};
  return [student.college, student.major, student.grade].filter(Boolean).join(" · ") || "学生信息待完善";
});
const statusTimelineTitle = computed(() => {
  const status = appointment.value.status;
  if (status === "pending") return "等待咨询师确认";
  if (status === "confirmed") return "咨询师已确认预约";
  if (status === "in_progress") return "学生已签到，咨询进行中";
  if (status === "completed") return "咨询师已完成咨询";
  if (status === "rejected") return `预约已拒绝：${appointment.value.rejectReason || "原因待补充"}`;
  if (status === "cancelled") return `预约已取消：${appointment.value.cancelReason || "原因待补充"}`;
  if (status === "no_show") return "已标记未到";
  return "预约状态已更新";
});
const secondaryActionText = computed(() => {
  const status = appointment.value.status;
  if (status === "pending") return "拒绝预约";
  if (status === "in_progress") return "填写记录";
  return "查看档案";
});
const primaryActionText = computed(() => {
  const status = appointment.value.status;
  if (status === "pending") return "确认预约";
  if (status === "confirmed") return "签到/开始";
  if (status === "in_progress") return "完成咨询";
  if (status === "completed") return "补充记录";
  return "返回列表";
});
const secondaryDisabled = computed(() => false);
const primaryDisabled = computed(() => false);

onLoad((query) => {
  appointmentId.value = query?.id || "";
  loadDetail();
});

async function loadDetail() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回预约列表重新进入。";
    uni.showToast({ title: "缺少预约ID", icon: "none" });
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    appointment.value = await getCounselorAppointment(appointmentId.value);
  } catch (error) {
    errorText.value = error.message || "预约详情读取失败";
    uni.showToast({ title: error.message || "预约详情读取失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function handlePrimary() {
  const status = appointment.value.status;
  if (status === "pending") return runAction(() => confirmAppointment(appointmentId.value), "已确认预约");
  if (status === "confirmed") return runAction(() => checkinAppointment(appointmentId.value), "已开始咨询");
  if (status === "in_progress") {
    return runAction(() => completeAppointment(appointmentId.value, { summary: "已完成本次咨询" }), "已完成咨询");
  }
  if (status === "completed") return goRecord();
  return go("/pages/counselor/appointments");
}

function handleSecondary() {
  const status = appointment.value.status;
  if (status === "pending") {
    uni.showModal({
      title: "拒绝预约",
      content: "确认拒绝该学生的预约申请吗？",
      success: async (result) => {
        if (result.confirm) {
          await runAction(() => rejectAppointment(appointmentId.value, { reason: "咨询师暂无法接待该时段" }), "已拒绝预约");
        }
      }
    });
    return;
  }
  if (status === "in_progress") return goRecord();
  const studentId = appointment.value.studentId || appointment.value.student?.id || "";
  if (!studentId) return uni.showToast({ title: "缺少学生信息", icon: "none" });
  return go(`/pages/counselor/student-detail?id=${studentId}`);
}

async function runAction(task, title) {
  actionLoading.value = true;
  try {
    appointment.value = await task();
    uni.showToast({ title, icon: "success" });
  } catch (error) {
    uni.showToast({ title: error.message || "操作失败", icon: "none" });
  } finally {
    actionLoading.value = false;
  }
}

function statusText(status) {
  const map = {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "咨询中",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到"
  };
  return map[status] || "预约详情";
}

function statusDesc(status) {
  const map = {
    pending: "等待老师确认预约",
    confirmed: "预约已确认，请按时接待",
    in_progress: "学生已签到，咨询正在进行",
    completed: "本次咨询已完成",
    cancelled: "学生已取消本次预约",
    rejected: "本次预约已被拒绝",
    no_show: "本次预约已标记未到"
  };
  return map[status] || "预约状态已更新";
}

function statusPill(status) {
  if (status === "pending") return "待处理";
  if (status === "confirmed") return "待签到";
  if (status === "in_progress") return "进行中";
  if (status === "completed") return "已完成";
  return "已结束";
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

function formatDate(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTimeRange(schedule) {
  if (!schedule) return "时间待确认";
  return `${formatDate(schedule.startAt)} ${formatTime(schedule.startAt)}-${formatTime(schedule.endAt)}`;
}

function formatFullTime(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${formatTime(value)}`;
}

function go(url) {
  goPage(url);
}

function goRecord() {
  if (!appointmentId.value) return uni.showToast({ title: "缺少预约记录", icon: "none" });
  return go(`/pages/counselor/write-record?id=${appointmentId.value}`);
}

function back() {
  safeBackCounselor("/pages/counselor/appointments");
}
</script>

<style scoped>
.counselor-detail-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.proto-stack {
  display: grid;
  gap: 24rpx;
  padding: 24rpx 32rpx 0;
}

.detail-stack {
  padding-bottom: 180rpx;
}

.proto-card {
  width: 100%;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37, 99, 235, .06);
}

.status-hero {
  min-height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx;
  border-radius: 28rpx;
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgba(249, 115, 22, .2);
}

.status-hero.waiting {
  background: linear-gradient(135deg, #FB923C 0%, #F97316 100%);
}

.status-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
}

.status-desc {
  display: block;
  margin-top: 8rpx;
  color: rgba(255,255,255,.86);
  font-size: 24rpx;
}

.status-pill {
  max-width: 128rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255,255,255,.2);
  font-size: 22rpx;
  font-weight: 800;
}

.student-card {
  padding: 30rpx;
}

.student-head {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.student-avatar {
  width: 92rpx;
  height: 92rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: #fff;
  background: #4A90D9;
  font-size: 34rpx;
  font-weight: 900;
}

.student-info {
  min-width: 0;
  flex: 1;
}

.student-name {
  display: block;
  color: #111827;
  font-size: 30rpx;
  font-weight: 900;
}

.student-meta {
  display: block;
  margin-top: 6rpx;
  color: #6B7280;
  font-size: 22rpx;
}

.risk-tag {
  flex: none;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 800;
}

.risk-tag.low {
  color: #16A34A;
  background: #DCFCE7;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
  margin-top: 28rpx;
}

.info-grid > view {
  min-height: 108rpx;
  padding: 18rpx;
  border-radius: 18rpx;
  background: #F8FAFC;
}

.grid-label {
  display: block;
  color: #94A3B8;
  font-size: 21rpx;
}

.grid-value {
  display: block;
  margin-top: 8rpx;
  color: #1F2937;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.35;
}

.section-card {
  display: grid;
  gap: 18rpx;
  padding: 30rpx;
}

.error-card {
  border: 1rpx solid #FECACA;
  color: #B91C1C;
  background: #FEF2F2;
}

.error-return-btn {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.paragraph {
  color: #4B5563;
  font-size: 25rpx;
  line-height: 1.7;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.warm-note {
  padding: 20rpx;
  border-radius: 18rpx;
  color: #92400E;
  background: #FFF7ED;
  font-size: 23rpx;
  line-height: 1.5;
}

.timeline {
  display: grid;
  gap: 20rpx;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 18rpx;
  padding-left: 4rpx;
}

.timeline-item::before {
  content: "";
  position: absolute;
  left: 11rpx;
  top: 30rpx;
  bottom: -18rpx;
  width: 2rpx;
  background: #E5E7EB;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  width: 24rpx;
  height: 24rpx;
  flex: none;
  margin-top: 6rpx;
  border-radius: 50%;
  background: #CBD5E1;
}

.timeline-item.active .timeline-dot {
  background: #4A90D9;
}

.timeline-title {
  display: block;
  color: #1F2937;
  font-size: 24rpx;
  font-weight: 800;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.timeline-time {
  display: block;
  margin-top: 6rpx;
  color: #94A3B8;
  font-size: 21rpx;
}

.fixed-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 20rpx;
  padding: 22rpx 32rpx 34rpx;
  border-top: 1rpx solid #E5E7EB;
  background: rgba(255,255,255,.96);
}

.primary-btn,
.secondary-btn {
  height: 86rpx;
  flex: 1;
  border-radius: 22rpx;
  font-size: 27rpx;
  font-weight: 900;
}

.primary-btn {
  color: #fff;
  background: #4A90D9;
}

.secondary-btn {
  color: #4A90D9;
  background: #EFF6FF;
}

.primary-btn.disabled,
.secondary-btn.disabled {
  color: #94A3B8;
  background: #F1F5F9;
}

.bottom-space {
  height: 1rpx;
}
</style>
