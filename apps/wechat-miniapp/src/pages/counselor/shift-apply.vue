<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">调班申请</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view v-if="loading" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon calendar"></view></view><text>正在读取排班...</text></view>
          <view v-else-if="error" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon calendar"></view></view><text>{{ error }}</text></view>
          <view class="sp-card cp-section-card"><text class="cp-section-title">原排班</text><view class="cp-info-list"><view class="cp-info-row"><text>日期</text><text>{{ formatDate(selectedSchedule?.startAt) }}</text></view><view class="cp-info-row"><text>时间</text><text>{{ formatRange(selectedSchedule) }}</text></view><view class="cp-info-row"><text>地点</text><text>{{ selectedSchedule?.room?.name || "地点待确认" }}</text></view></view><view v-if="schedules.length > 1" class="cp-option-grid two"><button v-for="item in schedules" :key="item.id" class="cp-option" :class="{ active: item.id === selectedScheduleId }" @click="selectedScheduleId = item.id">{{ formatDate(item.startAt) }} {{ formatRange(item) }}</button></view></view><view class="sp-card cp-section-card"><text class="cp-section-title">调班信息</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">调整日期</text><picker mode="date" :value="form.date" :start="today" @change="form.date = $event.detail.value"><view class="sp-picker">{{ form.date }} {{ weekLabel(form.date) }}</view></picker></view><view class="sp-field"><text class="sp-label">调整时段</text><picker :range="timeSlotLabels" :value="selectedTimeSlotIndex" @change="selectTimeSlot"><view class="sp-picker">{{ form.timeSlot }}</view></picker></view><view class="sp-field"><text class="sp-label">申请原因</text><textarea class="sp-textarea" v-model="form.reason" placeholder="请说明调班原因" /></view></view></view>
        </view></scroll-view></view>
    <view class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting || !selectedSchedule" @click="submit">提交申请</button></view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { getCounselorSchedules, submitShiftApplication } from "../../api/counselor";
import { safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const schedules = ref([]);
const selectedScheduleId = ref("");
const today = dateKey(new Date());
const form = reactive({
  date: today,
  timeSlot: "10:30-11:30",
  reason: ""
});

const timeSlots = [
  "09:00-10:00",
  "10:30-11:30",
  "14:00-15:00",
  "15:30-16:30"
];

const timeSlotLabels = computed(() => timeSlots);
const selectedTimeSlotIndex = computed(() => Math.max(0, timeSlots.findIndex((item) => item === form.timeSlot)));
const selectedSchedule = computed(() => schedules.value.find((item) => item.id === selectedScheduleId.value) || null);

onLoad((query = {}) => {
  selectedScheduleId.value = query.scheduleId || "";
});

onShow(() => {
  loadSchedules();
});

async function loadSchedules() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorSchedules();
    schedules.value = (Array.isArray(list) ? list : []).filter((item) => !isActiveAppointment(item.appointment));
    if (!selectedScheduleId.value || !schedules.value.some((item) => item.id === selectedScheduleId.value)) {
      selectedScheduleId.value = schedules.value[0]?.id || "";
    }
  } catch (err) {
    error.value = err.message || "排班读取失败";
  } finally {
    loading.value = false;
  }
}

function selectTimeSlot(event) {
  form.timeSlot = timeSlots[Number(event.detail.value)] || timeSlots[0];
}

async function submit() {
  if (!selectedSchedule.value) {
    toast("请选择原排班");
    return;
  }
  if (!form.reason.trim()) {
    toast("请填写调班原因");
    return;
  }
  const [startTime, endTime] = form.timeSlot.split("-");
  const toStartAt = toDateTime(form.date, startTime);
  const toEndAt = toDateTime(form.date, endTime);
  if (!validateRange(toStartAt, toEndAt)) return;
  submitting.value = true;
  try {
    await submitShiftApplication({
      scheduleId: selectedSchedule.value.id,
      fromStartAt: selectedSchedule.value.startAt,
      fromEndAt: selectedSchedule.value.endAt,
      toStartAt: toStartAt.toISOString(),
      toEndAt: toEndAt.toISOString(),
      reason: form.reason.trim()
    });
    uni.showToast({ title: "调班申请已提交", icon: "success" });
    setTimeout(() => back(), 700);
  } catch (err) {
    toast(err.message || "调班申请失败");
  } finally {
    submitting.value = false;
  }
}

function back() { safeBackCounselor("/pages/counselor/schedule"); }
function toast(title) { uni.showToast({ title, icon: 'none' }); }

function validateRange(startAt, endAt) {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    toast("调整时间格式不正确");
    return false;
  }
  if (endAt.getTime() <= startAt.getTime()) {
    toast("结束时间必须晚于开始时间");
    return false;
  }
  if (startAt.getTime() <= Date.now()) {
    toast("不能调整到过去时间");
    return false;
  }
  return true;
}

function isActiveAppointment(appointment) {
  if (!appointment) return false;
  return !["cancelled", "rejected"].includes(appointment.status);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(value) {
  if (!value) return "日期待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日期待确认";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${weekLabel(value)}`;
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

function weekLabel(value) {
  const date = new Date(value);
  const labels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return labels[date.getDay()] || "";
}

function toDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.cp-section-title,
.cp-info-row text,
.sp-label,
.sp-picker,
.sp-textarea,
.cp-option,
.cp-empty-mini text {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-info-row {
  align-items: flex-start;
  gap: 18rpx;
}

.cp-info-row text:last-child {
  min-width: 0;
  text-align: right;
}

.sp-textarea {
  min-height: 180rpx;
}
</style>
