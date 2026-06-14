<template>
  <view class="mobile-container sp-page cp-page" :style="layoutStyle">
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
      <text class="sp-header-title">排班设置</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-with-tabbar schedule-proto-stack">
          <view class="cp-calendar-card">
            <view class="cp-calendar-head">
              <text>2026年5月</text>
              <view class="cp-calendar-arrows">
                <text>‹</text>
                <text>›</text>
              </view>
            </view>
            <view class="cp-calendar-week">
              <text>一</text>
              <text>二</text>
              <text>三</text>
              <text>四</text>
              <text>五</text>
              <text>六</text>
              <text>日</text>
            </view>
            <view class="cp-calendar-days">
              <button
                v-for="day in calendarDays"
                :key="day.key"
                :class="{ active: selectedDateKey === day.key, muted: day.muted }"
                @click="selectedDateKey = day.key"
              >
                {{ day.day }}
              </button>
            </view>
          </view>

          <view class="schedule-filter-row">
            <button v-for="item in statusFilters" :key="item.key" :class="['schedule-filter', { active: activeStatus === item.key }]" @click="selectStatus(item.key)">
              {{ item.label }}
            </button>
          </view>

          <view class="cp-section-row">
            <text class="cp-section-title">当日可用时段</text>
            <button class="cp-text-link" @click="go('/pages/counselor/schedule-create')">+ 添加时段</button>
          </view>

          <view v-if="loading" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon calendar"></view></view>
            <text>正在读取排班...</text>
          </view>

          <view v-else-if="error" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon calendar"></view></view>
            <text>{{ error }}</text>
          </view>

          <template v-else-if="selectedSlots.length">
            <view
              v-for="slot in selectedSlots"
              :key="slot.id"
              class="cp-schedule-slot"
              :class="isActiveAppointment(slot.appointment) ? 'booked' : 'empty'"
            >
              <view class="cp-slot-icon"><view class="mini-icon clock"></view></view>
              <view class="cp-slot-main">
                <text class="cp-name lg">{{ formatTime(slot.startAt) }} - {{ formatTime(slot.endAt) }}</text>
                <text class="cp-slot-status" :class="{ green: isActiveAppointment(slot.appointment) }">{{ slotStatusText(slot) }}</text>
              </view>
              <text v-if="isActiveAppointment(slot.appointment)" class="cp-more-dot">⋮</text>
              <button v-else class="cp-delete" @click.stop="go(`/pages/counselor/shift-apply?scheduleId=${slot.id}`)">调</button>
            </view>
          </template>

          <view v-else class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon calendar"></view></view>
            <text>当天暂无排班</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="sp-bottom-actions above-tabbar schedule-save-bar">
      <button class="sp-primary" @click="loadSchedules">刷新排班</button>
    </view>

    <view class="sp-tabbar cp-tabbar">
      <button class="sp-tab active" @click="go('/pages/counselor/dashboard')">
        <view class="mini-icon dashboard"></view>
        <text>工作台</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/appointments')">
        <view class="mini-icon calendar"></view>
        <text>预约</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/students')">
        <view class="mini-icon students"></view>
        <text>学生</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/profile')">
        <view class="mini-icon profile"></view>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCounselorSchedules } from "../../api/counselor";
import { goPage, safeBackCounselor } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const loading = ref(false);
const error = ref("");
const schedules = ref([]);
const selectedDateKey = ref("");
const activeStatus = ref("");
const layoutStyle = getLayoutVars();

const statusFilters = [
  { key: "", label: "全部状态" },
  { key: "available", label: "可预约" },
  { key: "booked", label: "已预约" },
  { key: "disabled", label: "已禁用" }
];

const sortedSchedules = computed(() => [...schedules.value].sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));

const calendarDays = computed(() => {
  const keys = [];
  sortedSchedules.value.forEach((item) => {
    const key = dateKey(item.startAt);
    if (key && !keys.includes(key)) keys.push(key);
  });
  if (!keys.length) {
    const today = new Date();
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      keys.push(dateKey(date));
    }
  }
  return keys.slice(0, 7).map((key) => ({
    key,
    day: Number(key.slice(-2)),
    muted: !sortedSchedules.value.some((item) => dateKey(item.startAt) === key)
  }));
});

const selectedSlots = computed(() => sortedSchedules.value.filter((item) => dateKey(item.startAt) === selectedDateKey.value));

onShow(() => {
  loadSchedules();
});

async function loadSchedules() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorSchedules(activeStatus.value ? { status: activeStatus.value } : {});
    schedules.value = Array.isArray(list) ? list : [];
    if (!selectedDateKey.value || !calendarDays.value.some((item) => item.key === selectedDateKey.value)) {
      selectedDateKey.value = calendarDays.value[0]?.key || "";
    }
  } catch (err) {
    error.value = err.message || "排班读取失败";
  } finally {
    loading.value = false;
  }
}

function selectStatus(status) {
  activeStatus.value = status;
  loadSchedules();
}

function go(url) {
  goPage(url);
}

function back() {
  safeBackCounselor("/pages/counselor/dashboard");
}

function toast(title) {
  uni.showToast({ title, icon: "none" });
}

function slotStatusText(slot) {
  if (slot.booked || isActiveAppointment(slot.appointment)) return "已预约";
  if (slot.status && !["active", "available"].includes(slot.status)) return "暂不可约";
  return `空闲（${slot.room?.name || "咨询室待确认"}）`;
}

function isActiveAppointment(appointment) {
  if (!appointment) return false;
  return !["cancelled", "rejected"].includes(appointment.status);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.schedule-proto-stack {
  padding-bottom: 240rpx;
}

.schedule-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.schedule-filter {
  min-width: 112rpx;
  height: 58rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 900;
}

.schedule-filter.active {
  color: #fff;
  background: #4A90D9;
}

.cp-calendar-head text,
.cp-name,
.cp-slot-status,
.cp-empty-mini text,
.cp-text-link {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-schedule-slot {
  min-width: 0;
}

.schedule-save-bar {
  padding-bottom: calc(34rpx + env(safe-area-inset-bottom));
}
</style>
