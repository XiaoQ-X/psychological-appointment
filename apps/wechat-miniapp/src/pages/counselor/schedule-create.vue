<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">新增排班</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view v-if="loading" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon calendar"></view></view><text>正在读取咨询室...</text></view>
          <view v-else-if="error" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon calendar"></view></view><text>{{ error }}</text></view>
          <view class="sp-card cp-section-card"><text class="cp-section-title">排班信息</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">排班日期</text><picker mode="date" :value="form.date" :start="today" @change="form.date = $event.detail.value"><view class="sp-picker">{{ dateLabel }}</view></picker></view><view class="sp-field"><text class="sp-label">时间段</text><view class="cp-option-grid two"><button v-for="slot in timeSlots" :key="slot.value" class="cp-option" :class="{ active: form.timeSlot === slot.value }" @click="form.timeSlot = slot.value">{{ slot.label }}</button></view></view><view class="sp-field"><text class="sp-label">咨询室</text><picker :range="roomNames" :value="selectedRoomIndex" @change="selectRoom"><view class="sp-picker">{{ selectedRoomName }}</view></picker></view><view class="sp-field"><text class="sp-label">咨询方式</text><view class="cp-option-grid two"><button class="cp-option active">线下咨询</button><button class="cp-option disabled" disabled>线上后续开放</button></view><text class="cp-note">当前排班接口仅支持线下咨询室排班。</text></view></view></view>
        </view></scroll-view></view>
    <view class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting || !form.roomId" @click="submit">保存排班</button></view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { createCounselorSchedule, getCounselorRooms } from "../../api/counselor";
import { safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const rooms = ref([]);
const today = dateKey(new Date());
const form = reactive({
  date: today,
  timeSlot: "09:00-10:00",
  roomId: ""
});

const timeSlots = [
  { value: "09:00-10:00", label: "09:00-10:00" },
  { value: "10:30-11:30", label: "10:30-11:30" },
  { value: "14:00-15:00", label: "14:00-15:00" },
  { value: "15:30-16:30", label: "15:30-16:30" }
];

const roomNames = computed(() => rooms.value.map((item) => item.campus?.name ? `${item.campus.name} · ${item.name}` : item.name));
const selectedRoomIndex = computed(() => Math.max(0, rooms.value.findIndex((item) => item.id === form.roomId)));
const selectedRoomName = computed(() => roomNames.value[selectedRoomIndex.value] || "暂无可用咨询室");
const dateLabel = computed(() => `${form.date} ${weekLabel(form.date)}`);

onShow(() => {
  loadRooms();
});

async function loadRooms() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorRooms();
    rooms.value = Array.isArray(list) ? list : [];
    if (!form.roomId && rooms.value.length) {
      form.roomId = rooms.value[0].id;
    }
  } catch (err) {
    error.value = err.message || "咨询室读取失败";
  } finally {
    loading.value = false;
  }
}

function selectRoom(event) {
  const index = Number(event.detail.value);
  form.roomId = rooms.value[index]?.id || "";
}

async function submit() {
  if (!form.roomId) {
    toast("请选择咨询室");
    return;
  }
  const [startTime, endTime] = form.timeSlot.split("-");
  const startAt = toDateTime(form.date, startTime);
  const endAt = toDateTime(form.date, endTime);
  if (!validateRange(startAt, endAt)) return;
  submitting.value = true;
  try {
    await createCounselorSchedule({
      roomId: form.roomId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString()
    });
    uni.showToast({ title: "排班已新增", icon: "success" });
    setTimeout(() => back(), 700);
  } catch (err) {
    toast(err.message || "排班新增失败");
  } finally {
    submitting.value = false;
  }
}

function back() { safeBackCounselor("/pages/counselor/schedule"); }
function toast(title) { uni.showToast({ title, icon: 'none' }); }

function validateRange(startAt, endAt) {
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    toast("排班时间格式不正确");
    return false;
  }
  if (endAt.getTime() <= startAt.getTime()) {
    toast("结束时间必须晚于开始时间");
    return false;
  }
  if (startAt.getTime() <= Date.now()) {
    toast("不能新增过去时间的排班");
    return false;
  }
  return true;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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
.sp-label,
.sp-picker,
.cp-option,
.cp-note {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  margin-top: 10rpx;
  color: #94A3B8;
  font-size: 22rpx;
  line-height: 1.55;
}

.cp-option.disabled {
  color: #94A3B8;
  background: #F1F5F9;
}
</style>
