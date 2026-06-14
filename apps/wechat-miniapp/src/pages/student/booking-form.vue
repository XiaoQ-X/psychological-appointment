<template>
  <view class="mobile-container sp-page" :style="layoutStyle">
    <view class="sp-status"><text>09:41</text><view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view></view>
    <view class="sp-header">
      <button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">预约申请</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="booking-form-stack">
          <view v-if="errorText" class="form-section">
            <view class="form-error-card">
              <text>{{ errorText }}</text>
              <button class="form-error-action" @click="goList">返回咨询师列表</button>
            </view>
          </view>

          <view class="form-counselor-summary">
            <view class="sp-row counselor-line">
              <image class="summary-avatar" mode="aspectFill" :src="summary.avatar" />
              <view>
                <text class="summary-name">{{ summary.name }}</text>
                <text class="summary-title">{{ summary.title }}</text>
              </view>
            </view>
          </view>

          <view class="form-section">
            <text class="form-section-title">选择预约日期</text>
            <scroll-view class="date-scroll" scroll-x enhanced :show-scrollbar="false">
              <view class="date-scroll-inner">
                <button v-for="date in scheduleDates" :key="date.key" :class="['form-date', { active: date.key === selectedDateKey }]" @click="selectedDateKey = date.key"><text>{{ date.week }}</text><text>{{ date.day }}</text></button>
              </view>
            </scroll-view>
          </view>

          <view class="form-section">
            <text class="form-section-title">选择时间段</text>
            <view class="form-time-grid">
              <button v-for="item in selectedSchedules" :key="item.id" :class="['form-time', { active: item.id === selectedScheduleId }]" @click="selectedScheduleId = item.id">{{ item.timeText }}</button>
              <button v-if="!selectedSchedules.length" class="form-time disabled">暂无时段</button>
            </view>
          </view>

          <view class="form-section">
            <text class="form-section-title">咨询方式</text>
            <view class="method-row">
              <button :class="['method-option', bookingType === 'offline' ? 'active' : '']" @click="bookingType = 'offline'"><view class="mini-icon profile"></view><text>线下咨询</text></button>
              <button :class="['method-option', bookingType === 'online' ? 'active' : '']" @click="bookingType = 'online'"><view class="mini-icon video"></view><text>线上视频</text></button>
            </view>
          </view>

          <view class="form-section">
            <text class="form-section-title">咨询原因</text>
            <textarea v-model="concern" class="reason-textarea" placeholder="请简要描述您目前遇到的困扰（限500字）..." />
          </view>

          <view class="consent-line" @click="consentAccepted = !consentAccepted">
            <view :class="['login-check-dot', consentAccepted ? 'checked' : '']"></view>
            <text>我已阅读并同意 <text class="consent-link" @click.stop="go('/pages/student/consent')">《心理咨询知情同意书》</text>，了解咨询流程及保密协议。</text>
          </view>

          <view class="form-submit-section">
            <button class="sp-primary form-submit-button" :disabled="!!errorText" @click="goConfirm">提交预约申请</button>
          </view>
        </view>
      </scroll-view>
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
const selectedScheduleId = ref("");
const errorText = ref("");
const summary = ref({
  name: "请选择咨询师",
  title: "咨询师信息加载中",
  avatar: BRAND_ASSETS.defaultCounselorAvatar,
  initial: "咨"
});
const schedules = ref([]);
const selectedDateKey = ref("");
const bookingType = ref("offline");
const concern = ref("");
const consentAccepted = ref(false);

const scheduleDates = computed(() => {
  const map = new Map();
  schedules.value.forEach((item) => {
    const date = new Date(item.startAt);
    if (Number.isNaN(date.getTime())) return;
    const key = date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, {
        key,
        week: `周${"日一二三四五六"[date.getDay()]}`,
        day: String(date.getDate()).padStart(2, "0")
      });
    }
  });
  return [...map.values()];
});
const selectedSchedules = computed(() => schedules.value
  .filter((item) => item.dateKey === selectedDateKey.value)
  .map((item) => ({ ...item, timeText: `${formatTime(item.startAt)}-${formatTime(item.endAt)}` })));

onLoad((query = {}) => {
  counselorId.value = query.counselorId || "";
  selectedScheduleId.value = query.scheduleId || "";
  loadBookingBase();
});

async function loadBookingBase() {
  if (!counselorId.value) {
    errorText.value = "缺少咨询师信息，请返回咨询师列表重新选择。";
    return;
  }
  try {
    const [detail, scheduleList] = await Promise.all([
      getCounselorDetail(counselorId.value),
      getSchedules({ counselorId: counselorId.value })
    ]);
    summary.value = {
      name: detail?.name || "咨询师",
      title: `${detail?.title || "心理咨询师"}${Array.isArray(detail?.specialties) && detail.specialties.length ? ` | 擅长${detail.specialties[0]}` : ""}`,
      avatar: resolveApiAssetUrl(detail?.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
      initial: String(detail?.name || "咨").slice(0, 1)
    };
    schedules.value = normalizeSchedules(scheduleList);
    const selected = schedules.value.find((item) => item.id === selectedScheduleId.value) || schedules.value[0];
    selectedScheduleId.value = selected?.id || "";
    selectedDateKey.value = selected?.dateKey || "";
  } catch (error) {
    errorText.value = error.message || "预约信息加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "预约信息加载失败", icon: "none" });
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

function back() {
  safeBackStudent("/pages/student/counselors");
}

function goList() {
  goPrimaryPage("/pages/student/counselors");
}

function goConfirm() {
  if (errorText.value) return;
  if (!selectedScheduleId.value) {
    uni.showToast({ title: "请选择预约时段", icon: "none" });
    return;
  }
  if (!concern.value.trim()) {
    uni.showToast({ title: "请填写咨询原因", icon: "none" });
    return;
  }
  if (!consentAccepted.value) {
    uni.showToast({ title: "请先阅读并同意知情同意书", icon: "none" });
    return;
  }
  const selectedSchedule = schedules.value.find((item) => item.id === selectedScheduleId.value);
  uni.setStorageSync("pending_booking", {
    counselorId: counselorId.value,
    scheduleId: selectedScheduleId.value,
    type: bookingType.value,
    concern: concern.value.trim(),
    consentAccepted: consentAccepted.value,
    counselor: summary.value,
    schedule: selectedSchedule || null
  });
  goPage(`/pages/student/booking-confirm?counselorId=${counselorId.value}&scheduleId=${selectedScheduleId.value}`);
}
</script>

<style scoped>
.booking-form-stack {
  display: grid;
  gap: 36rpx;
  padding: 0 0 44rpx;
}

.form-counselor-summary {
  padding: 28rpx 40rpx;
  background: #fff;
}

.counselor-line {
  gap: 24rpx;
}

.summary-avatar {
  width: 112rpx;
  height: 112rpx;
  flex: none;
  border-radius: 999rpx;
  background: #EBF3FC;
}

.fallback-avatar {
  display: grid;
  place-items: center;
  color: #4A90D9;
  font-size: 38rpx;
  font-weight: 900;
}

.summary-name {
  display: block;
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 900;
}

.summary-title {
  display: block;
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.form-section {
  padding: 0 40rpx;
}

.form-section-title {
  display: block;
  margin-bottom: 22rpx;
  color: #1f2937;
  font-size: 26rpx;
  font-weight: 900;
}

.date-scroll {
  width: 100%;
  white-space: nowrap;
}

.date-scroll-inner {
  display: flex;
  gap: 24rpx;
}

.form-date {
  width: 112rpx;
  height: 128rpx;
  display: grid;
  place-items: center;
  gap: 4rpx;
  flex: none;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  color: #1f2937;
  background: #fff;
  font-size: 24rpx;
}

.form-date text:first-child {
  color: #9ca3af;
  font-size: 20rpx;
}

.form-date text:last-child {
  font-size: 30rpx;
  font-weight: 900;
}

.form-date.active {
  border-color: #4A90D9;
  color: #fff;
  background: #4A90D9;
}

.form-date.active text {
  color: #fff;
}

.form-time-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
}

.form-time {
  min-height: 72rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 18rpx;
  color: #1f2937;
  background: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.form-time.active {
  border-color: #4A90D9;
  color: #4A90D9;
  background: #eff6ff;
}

.form-time.disabled {
  color: #d1d5db;
  background: #f9fafb;
}

.method-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28rpx;
}

.method-option {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  color: #6b7280;
  background: #fff;
  font-size: 26rpx;
  font-weight: 800;
}

.method-option .mini-icon {
  width: 34rpx;
  height: 34rpx;
}

.method-option.active {
  border-color: #4A90D9;
  color: #2563eb;
  background: #eff6ff;
}

.reason-textarea {
  width: 100%;
  height: 176rpx;
  padding: 24rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  color: #1f2937;
  background: #fff;
  font-size: 26rpx;
  line-height: 1.5;
}

.consent-line {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 0 40rpx;
  color: #6b7280;
  font-size: 22rpx;
  line-height: 1.6;
}

.login-check-dot {
  width: 28rpx;
  height: 28rpx;
  flex: none;
  margin-top: 2rpx;
  border: 2rpx solid #4A90D9;
  border-radius: 8rpx;
  background: #EBF3FC;
}

.login-check-dot.checked {
  background: #4A90D9;
}

.consent-link {
  color: #4A90D9;
  text-decoration: underline;
}

.form-submit-section {
  padding: 0 40rpx 8rpx;
}

.form-submit-button {
  width: 100%;
  height: 96rpx;
  border-radius: 28rpx;
  box-shadow: 0 8rpx 18rpx rgba(74,144,217,.18);
}

.form-error-card {
  display: grid;
  gap: 20rpx;
  padding: 28rpx;
  border: 1rpx solid #fecaca;
  border-radius: 24rpx;
  color: #b91c1c;
  background: #fef2f2;
  font-size: 24rpx;
}

.form-error-action {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}
/* 上线前自适应收口：预约表单长文本、时段和输入框不横向溢出。 */
text,
button,
input,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.reason-textarea {
  box-sizing: border-box;
}
</style>
