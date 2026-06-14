<template>
  <view class="mobile-container sp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header">
      <button class="sp-back" @click="back">
        <view class="mini-icon chevron-left"></view>
      </button>
      <text class="sp-header-title">预约改期申请</text>
      <view class="sp-header-spacer"></view>
    </view>

    <scroll-view class="sp-content" scroll-y enhanced :show-scrollbar="false">
      <view v-if="submitted" class="sp-success-wrap">
        <view class="sp-success-icon green">✓</view>
        <text class="sp-success-title">已提交改期申请</text>
        <text class="sp-success-desc">等待咨询师确认...</text>

        <view class="sp-card sp-success-card">
          <view class="sp-info-row">
            <text>申请编号</text>
            <text class="sp-info-value">{{ rescheduleSummary.id }}</text>
          </view>
          <view class="sp-info-row">
            <text>当前状态</text>
            <text class="sp-tag warning">待确认</text>
          </view>
          <text class="reschedule-note">您将在「我的预约」中查看处理进度</text>
        </view>

        <button class="sp-primary sp-success-btn" @click="goAppointments">返回我的预约</button>
      </view>

      <view v-else class="sp-stack reschedule-form">
        <view v-if="errorText" class="sp-card form-error-card">
          <text>{{ errorText }}</text>
          <button @click="goAppointments">返回我的预约</button>
        </view>

        <view v-if="!errorText" class="sp-card">
          <view class="sp-card-title-row">
            <view class="mini-icon document"></view>
            <text class="sp-title">当前预约信息</text>
          </view>
          <view class="reschedule-counselor">
            <view class="sp-avatar round small">{{ current.initial }}</view>
            <view>
              <text class="sp-title">{{ current.counselorName }}</text>
              <text class="sp-muted block">{{ current.counselorTitle }}</text>
            </view>
          </view>
          <view class="sp-info-list">
            <view class="sp-info-row">
              <text>当前时间</text>
              <text class="sp-info-value">{{ current.time }}</text>
            </view>
            <view class="sp-info-row">
              <text>咨询方式</text>
              <text class="sp-info-value">{{ current.typeText }}</text>
            </view>
            <view class="sp-info-row">
              <text>咨询地点</text>
              <text class="sp-info-value">{{ current.place }}</text>
            </view>
            <view class="sp-info-row">
              <text>当前状态</text>
              <text class="status-confirmed">{{ current.statusText }}</text>
            </view>
          </view>
        </view>

        <view v-if="!errorText" class="sp-card">
          <view class="sp-card-title-row">
            <view class="mini-icon edit"></view>
            <text class="sp-title">改期申请表单</text>
          </view>

          <view class="sp-field">
            <text class="sp-label">希望改期日期</text>
            <picker :range="dates" @change="onDateChange">
              <view class="sp-picker">{{ dates[dateIndex] || "请选择日期" }}</view>
            </picker>
          </view>

          <view class="sp-field">
            <text class="sp-label">希望改期时间段</text>
            <picker :range="times" @change="timeIndex = Number($event.detail.value)">
              <view class="sp-picker">{{ times[timeIndex] || "请选择时间段" }}</view>
            </picker>
          </view>

          <view class="sp-field">
            <text class="sp-label">改期原因（选填）</text>
            <textarea v-model="reason" class="sp-textarea" placeholder="请输入改期原因..." />
          </view>

          <view class="sp-field">
            <text class="sp-label">接受系统推荐相近时间</text>
            <view class="recommend-row">
              <button class="recommend-option" @click="acceptRecommend = true">
                <view :class="['radio-dot', acceptRecommend ? 'active' : '']"></view>
                <text>是</text>
              </button>
              <button class="recommend-option" @click="acceptRecommend = false">
                <view :class="['radio-dot', !acceptRecommend ? 'active' : '']"></view>
                <text>否</text>
              </button>
            </view>
          </view>
        </view>

        <view v-if="!errorText" class="reschedule-tip">
          <text class="reschedule-tip-title">温馨提示</text>
          <text>• 改期申请需咨询师或心理中心确认</text>
          <text>• 请尽量提前提交申请</text>
          <text>• 改期后原时段将释放给其他同学</text>
        </view>

        <view v-if="!errorText" class="sp-bottom-actions inline">
          <button class="sp-secondary" @click="goAppointmentDetail">取消</button>
          <button class="sp-primary" :loading="submitting" :disabled="submitting || !!errorText" @click="submitReschedule">提交改期申请</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getAppointmentDetail, getSchedules, rescheduleAppointment } from "../../api/student";
import { goPage, goPrimaryPage, replacePage, safeBackStudent } from "@/utils/navigation";

const appointmentId = ref("");
const errorText = ref("");
const submitted = ref(false);
const dateIndex = ref(0);
const timeIndex = ref(0);
const acceptRecommend = ref(false);
const reason = ref("");
const submitting = ref(false);
const appointment = ref(null);
const schedules = ref([]);
const rescheduleSummary = ref({ id: "提交后可在我的预约查看" });
const RESCHEDULABLE_STATUSES = ["pending", "confirmed"];

const dateGroups = computed(() => {
  const map = new Map();
  schedules.value.forEach((item) => {
    const date = new Date(item.startAt);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { label: `${date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}（周${"日一二三四五六"[date.getDay()]}）`, items: [] });
    }
    map.get(key).items.push(item);
  });
  return [...map.values()];
});

const dates = computed(() => ["请选择日期", ...dateGroups.value.map((item) => item.label)]);
const times = computed(() => {
  const group = dateGroups.value[dateIndex.value - 1];
  if (!group) return ["请选择时间段"];
  return ["请选择时间段", ...group.items.map((item) => formatRange(item.startAt, item.endAt, false))];
});

const selectedSchedule = computed(() => {
  const group = dateGroups.value[dateIndex.value - 1];
  return group?.items?.[timeIndex.value - 1] || null;
});

const current = computed(() => {
  const item = appointment.value || {};
  return {
    counselorName: item.counselor?.name || "咨询师",
    counselorTitle: item.counselor?.title || "心理中心专职咨询师",
    initial: String(item.counselor?.name || "咨").slice(0, 1),
    typeText: item.type === "online" ? "线上咨询" : "线下咨询",
    time: formatRange(item.schedule?.startAt, item.schedule?.endAt) || "当前时间待确认",
    place: item.type === "online" ? "线上视频咨询" : (item.room?.name || item.campus?.name || "心理中心咨询室"),
    statusText: statusText(item.status)
  };
});

onLoad((query = {}) => {
  appointmentId.value = query.id || "";
  loadRescheduleBase();
});

async function loadRescheduleBase() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    return;
  }
  try {
    const detail = await getAppointmentDetail(appointmentId.value);
    appointment.value = detail;
    if (!RESCHEDULABLE_STATUSES.includes(detail?.status)) {
      errorText.value = "当前预约状态不可改期。";
      return;
    }
    const list = await getSchedules({ counselorId: detail?.counselor?.id });
    schedules.value = (Array.isArray(list) ? list : []).filter((item) => item.id !== detail?.schedule?.id);
  } catch (error) {
    errorText.value = error.message || "改期信息加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "改期信息加载失败", icon: "none" });
  }
}

function onDateChange(event) {
  dateIndex.value = Number(event.detail.value);
  timeIndex.value = 0;
}

async function submitReschedule() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    uni.showToast({ title: "缺少预约记录", icon: "none" });
    return;
  }
  if (!selectedSchedule.value?.id) {
    uni.showToast({ title: "请选择新的预约时段", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const result = await rescheduleAppointment(appointmentId.value, {
      newScheduleId: selectedSchedule.value.id,
      reason: reason.value || (acceptRecommend.value ? "接受系统推荐相近时间" : "学生申请改期")
    });
    rescheduleSummary.value = {
      id: result?.appointmentNo || result?.id || "提交后可在我的预约查看"
    };
    submitted.value = true;
  } catch (error) {
    uni.showToast({ title: error.message || "改期申请提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function statusText(status) {
  const map = {
    pending: "待确认",
    confirmed: "已确认",
    cancelled: "已取消",
    completed: "已完成",
    rejected: "已拒绝",
    no_show: "未到访"
  };
  return map[status] || "状态待确认";
}

function formatRange(startAt, endAt, withDate = true) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "";
  const date = withDate ? `${start.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })} ` : "";
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : ` - ${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date}${startText}${endText}`;
}

function go(url) {
  goPage(url);
}

function detailUrl() {
  return appointmentId.value ? `/pages/student/appointment-detail?id=${appointmentId.value}` : "/pages/student/appointments";
}

function goAppointmentDetail() {
  replacePage(detailUrl());
}

function goAppointments() {
  goPrimaryPage("/pages/student/appointments");
}

function back() {
  safeBackStudent(detailUrl());
}
</script>

<style scoped>
.reschedule-form {
  padding-bottom: 40rpx;
}

.sp-card-title-row,
.reschedule-counselor,
.recommend-row,
.recommend-option {
  display: flex;
  align-items: center;
}

.sp-card-title-row {
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.sp-card-title-row .mini-icon {
  width: 32rpx;
  height: 32rpx;
  color: #4A90D9;
}

.reschedule-counselor {
  gap: 24rpx;
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.sp-avatar.small {
  width: 80rpx;
  height: 80rpx;
  font-size: 30rpx;
}

.block {
  display: block;
}

.status-confirmed {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EBF3FC;
  font-size: 20rpx;
  font-weight: 800;
}

.recommend-row {
  gap: 48rpx;
}

.recommend-option {
  gap: 14rpx;
  min-height: 48rpx;
  color: #6b7280;
  font-size: 24rpx;
  background: transparent;
}

.radio-dot {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 999rpx;
  background: #fff;
}

.radio-dot.active {
  border: 10rpx solid #4A90D9;
}

.reschedule-tip {
  display: grid;
  gap: 8rpx;
  padding: 28rpx;
  border: 1rpx solid #bfdbfe;
  border-radius: 32rpx;
  color: #1d4ed8;
  background: #eff6ff;
  font-size: 20rpx;
  line-height: 1.6;
}

.reschedule-tip-title {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #1e40af;
  font-size: 24rpx;
  font-weight: 800;
}

.reschedule-tip-title::before {
  content: "!";
  width: 28rpx;
  height: 28rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 18rpx;
}

.reschedule-note {
  display: block;
  margin-top: 18rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.form-error-card {
  gap: 20rpx;
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.form-error-card button {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.mini-icon.document,
.mini-icon.edit {
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

.mini-icon.edit::before {
  content: "";
  position: absolute;
  left: 8rpx;
  top: 7rpx;
  width: 18rpx;
  height: 5rpx;
  border-radius: 999rpx;
  background: currentColor;
  transform: rotate(-35deg);
}

.mini-icon.edit::after {
  content: "";
  position: absolute;
  left: 6rpx;
  top: 20rpx;
  width: 24rpx;
  height: 3rpx;
  background: currentColor;
}
/* 上线前自适应收口：改期原因、时段和底部按钮不横向溢出。 */
text,
button,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
