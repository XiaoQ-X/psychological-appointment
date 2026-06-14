<template>
  <view class="mobile-container sp-page">
    <view class="sp-status"><text>09:41</text><view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view></view>
    <view class="sp-header">
      <button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">确认预约</text>
      <view class="sp-header-spacer"></view>
    </view>
    <view class="sp-step-row">
      <view v-for="step in steps" :key="step.label" :class="['sp-step', { active: step.active }]">
        <text class="sp-step-num">{{ step.num }}</text>
        <text>{{ step.label }}</text>
      </view>
    </view>
    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack booking-confirm-stack">
          <view v-if="errorText" class="sp-card confirm-card error-card">
            <text class="sp-text">{{ errorText }}</text>
            <button class="sp-small-btn ghost" @click="go('/pages/student/counselors')">返回咨询师列表</button>
          </view>
          <view v-if="!errorText" class="sp-card confirm-card">
            <view class="confirm-card-title"><view class="mini-icon document"></view><text>预约摘要</text></view>
            <view class="sp-info-list section-gap">
              <view class="confirm-teacher-row">
                <text>咨询师</text>
                <view class="confirm-teacher">
                  <image class="confirm-avatar" mode="aspectFill" :src="booking.counselor.avatar" />
                  <text class="sp-info-value">{{ booking.counselor.name }}</text>
                </view>
              </view>
              <view class="sp-info-row"><text>咨询类型</text><text class="sp-info-value">常规咨询（50分钟）</text></view>
              <view class="sp-info-row"><text>预约时间</text><text class="sp-info-value">{{ booking.time }}</text></view>
              <view class="sp-info-row"><text>咨询方式</text><text class="sp-info-value">{{ booking.methodText }}</text></view>
              <view class="sp-info-row"><text>咨询地点</text><text class="sp-info-value">{{ booking.place }}</text></view>
            </view>
          </view>
          <view v-if="!errorText" class="sp-card confirm-card">
            <view class="confirm-card-title warning"><view class="mini-icon message"></view><text>主诉摘要</text></view>
            <text class="sp-text section-gap">{{ booking.concern }}</text>
          </view>
          <view v-if="!errorText" class="sp-card confirm-card">
            <view class="confirm-card-title success"><view class="mini-icon shield"></view><text>风险筛查结果</text></view>
            <view v-if="risk" class="risk-result-row section-gap">
              <view class="risk-score">{{ risk.score }}分</view>
              <view>
                <text class="sp-tag success">{{ risk.levelText }}</text>
                <text class="risk-desc">{{ risk.desc }}</text>
              </view>
            </view>
            <view v-else class="risk-empty section-gap">
              <text class="risk-empty-title">暂未完成风险筛查</text>
              <text class="risk-desc">系统不会默认判定低风险。如有紧急情况，请优先使用紧急帮助。</text>
            </view>
          </view>
          <view v-if="!errorText" class="sp-card confirm-card">
            <view class="sp-between">
              <view class="consent-confirm-line">
                <view class="confirm-check">✓</view>
                <text class="sp-text">已阅读并同意《心理咨询知情同意书》</text>
              </view>
              <button class="sp-small-btn ghost" @click="go('/pages/student/consent')">查看</button>
            </view>
          </view>
          <view v-if="!errorText" class="cancel-rule-card">
            <view class="rule-icon">!</view>
            <view>
              <text class="rule-title">取消规则提醒</text>
              <text class="rule-text">距离预约时间超过2小时可取消</text>
              <text class="rule-text">30天内3次未到将限制预约30天</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    <view v-if="!errorText" class="sp-bottom-actions above-tabbar">
      <button class="sp-primary" :loading="submitting" :disabled="submitting || !!errorText" @click="submitBooking">确认提交</button>
      <button class="sp-secondary" @click="back">返回修改</button>
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
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { createAppointment } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage, replacePage, safeBackStudent } from "@/utils/navigation";

const steps = [
  { num: 1, label: "选类型" },
  { num: 2, label: "选时间" },
  { num: 3, label: "填表单" },
  { num: 4, label: "确认", active: true },
  { num: 5, label: "完成" }
];

const submitting = ref(false);
const errorText = ref("");
const pendingBooking = ref(null);
const riskResult = ref(null);

const booking = computed(() => {
  const data = pendingBooking.value || {};
  const schedule = data.schedule || {};
  const room = schedule.room || {};
  const campus = schedule.campus || {};
  const counselor = data.counselor || {};
  return {
    counselor: {
      name: counselor.name || "咨询师",
      avatar: resolveApiAssetUrl(counselor.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
      initial: counselor.initial || String(counselor.name || "咨").slice(0, 1)
    },
    time: formatRange(schedule.startAt, schedule.endAt) || "待确认",
    methodText: data.type === "online" ? "线上视频" : "线下咨询",
    place: room.name || campus.name || "心理中心咨询室",
    concern: data.concern || "暂未填写咨询原因"
  };
});

const risk = computed(() => {
  if (!riskResult.value) return null;
  const score = Number(riskResult.value?.score || 0);
  const level = riskResult.value?.level || (score >= 20 ? "crisis" : score >= 15 ? "high" : score >= 8 ? "medium" : "low");
  if (level === "crisis") return { score, levelText: "危机风险", desc: "你的风险评估结果为危机风险，系统将同步提醒心理中心优先关注" };
  if (level === "high") return { score, levelText: "高风险", desc: "你的风险评估结果为高风险，系统将同步提醒心理中心关注" };
  if (level === "medium") return { score, levelText: "中风险", desc: "你的风险评估结果为中风险，可继续提交预约并等待老师确认" };
  return { score, levelText: "低风险", desc: "你的风险评估结果为低风险，可正常预约" };
});

onLoad(() => {
  pendingBooking.value = uni.getStorageSync("pending_booking") || null;
  riskResult.value = uni.getStorageSync("latest_risk_result") || null;
  if (!pendingBooking.value?.scheduleId) {
    errorText.value = "缺少预约信息，请返回咨询师列表重新选择。";
  }
});

async function submitBooking() {
  const data = pendingBooking.value;
  if (!data?.scheduleId) {
    errorText.value = "缺少预约信息，请返回咨询师列表重新选择。";
    uni.showToast({ title: "缺少预约时段，请返回重新选择", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const result = await createAppointment({
      scheduleId: data.scheduleId,
      type: data.type === "online" ? "online" : "offline",
      concern: data.concern,
      consentAccepted: data.consentAccepted !== false
    });
    uni.setStorageSync("latest_appointment", result);
    uni.removeStorageSync("pending_booking");
    replacePage(`/pages/student/booking-success?id=${result?.id || ""}`);
  } catch (error) {
    uni.showToast({ title: error.message || "预约提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "";
  const date = start.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : `-${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date} ${startText}${endText}`;
}

function go(url) { goPage(url); }
function goHome() { goPrimaryPage("/pages/student/home"); }
function back() { safeBackStudent("/pages/student/counselors"); }
</script>

<style scoped>
.section-gap { margin-top: 24rpx; }
.booking-confirm-stack { padding-bottom: 274rpx; }
.confirm-card-title,
.confirm-teacher-row,
.confirm-teacher,
.consent-confirm-line,
.risk-result-row,
.cancel-rule-card {
  display: flex;
  align-items: center;
}
.confirm-card-title {
  gap: 12rpx;
  color: #1f2937;
  font-size: 26rpx;
  font-weight: 900;
}
.confirm-card-title .mini-icon {
  width: 32rpx;
  height: 32rpx;
  color: #4A90D9;
}
.confirm-card-title.warning .mini-icon { color: #F5A623; }
.confirm-card-title.success .mini-icon { color: #10B981; }
.confirm-card .sp-info-row,
.confirm-teacher-row {
  min-height: 76rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
  color: #9ca3af;
  font-size: 24rpx;
}
.confirm-card .sp-info-row:last-child {
  border-bottom: none;
}
.confirm-teacher-row {
  justify-content: space-between;
}
.confirm-teacher {
  gap: 16rpx;
}
.confirm-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background: #EBF3FC;
}
.fallback-avatar {
  display: grid;
  place-items: center;
  color: #4A90D9;
  font-weight: 900;
}
.risk-result-row {
  gap: 24rpx;
}
.risk-score {
  width: 112rpx;
  height: 112rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 999rpx;
  color: #16a34a;
  background: #f0fdf4;
  font-size: 34rpx;
  font-weight: 900;
}
.risk-desc {
  display: block;
  margin-top: 10rpx;
  color: #6b7280;
  font-size: 22rpx;
}
.risk-empty {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}
.risk-empty-title {
  display: block;
  color: #374151;
  font-size: 24rpx;
  font-weight: 900;
}
.confirm-check {
  width: 64rpx;
  height: 64rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 999rpx;
  color: #10B981;
  background: #dcfce7;
  font-size: 34rpx;
  font-weight: 900;
}
.consent-confirm-line {
  gap: 20rpx;
  min-width: 0;
}
.cancel-rule-card {
  align-items: flex-start;
  gap: 18rpx;
  padding: 32rpx;
  border: 1rpx solid #fed7aa;
  border-radius: 32rpx;
  color: #c2410c;
  background: #fff7ed;
}
.rule-icon {
  width: 38rpx;
  height: 38rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 999rpx;
  color: #fff;
  background: #F5A623;
  font-size: 24rpx;
  font-weight: 900;
}
.rule-title {
  display: block;
  margin-bottom: 8rpx;
  color: #9a3412;
  font-size: 24rpx;
  font-weight: 900;
}
.rule-text {
  display: block;
  color: #ea580c;
  font-size: 20rpx;
  line-height: 1.55;
}

.mini-icon.document,
.mini-icon.message,
.mini-icon.shield {
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
.mini-icon.shield::before {
  content: "";
  position: absolute;
  left: 7rpx;
  top: 3rpx;
  width: 18rpx;
  height: 25rpx;
  border: 3rpx solid currentColor;
  border-radius: 8rpx 8rpx 12rpx 12rpx;
}
.mini-icon.shield::after {
  content: "";
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  width: 11rpx;
  height: 6rpx;
  border-left: 3rpx solid currentColor;
  border-bottom: 3rpx solid currentColor;
  transform: rotate(-45deg);
}
/* 上线前自适应收口：确认页字段和底部按钮不遮挡内容。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.booking-confirm-stack {
  padding-bottom: calc(274rpx + env(safe-area-inset-bottom));
}
</style>
