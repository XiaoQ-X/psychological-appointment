<template>
  <view class="mobile-container sp-page success-page">
    <view class="success-content">
      <view class="success-icon">✓</view>
      <text class="success-title">预约提交成功</text>
      <text class="success-desc">您的预约已提交，请耐心等待咨询师确认。确认结果将通过通知告知您。</text>
      <view class="success-summary">
        <view class="sp-info-row"><text>预约咨询师</text><text class="sp-info-value">{{ summary.counselorName }}</text></view>
        <view class="sp-info-row"><text>预约时间</text><text class="sp-info-value">{{ summary.time }}</text></view>
        <view class="sp-info-row"><text>咨询方式</text><text class="sp-info-value">{{ summary.type }}</text></view>
      </view>
      <view class="success-actions">
        <button class="sp-primary" @click="go('/pages/student/appointments')">查看我的预约</button>
        <button class="sp-secondary" @click="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { goPrimaryPage } from "@/utils/navigation";

const appointment = ref(null);

const summary = computed(() => {
  const item = appointment.value || {};
  const schedule = item.schedule || {};
  return {
    counselorName: item.counselor?.name || "咨询师",
    time: formatRange(schedule.startAt, schedule.endAt) || "等待确认",
    type: item.type === "online" ? "线上咨询" : "线下咨询"
  };
});

onLoad(() => {
  appointment.value = uni.getStorageSync("latest_appointment") || null;
});

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "";
  const date = start.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : `-${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date} ${startText}${endText}`;
}

function go(url) { goPrimaryPage(url); }
function goHome() { goPrimaryPage("/pages/student/home"); }
</script>

<style scoped>
.success-page { background: #f8fafc; }
.success-content {
  flex: 1;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 32rpx;
  padding: 64rpx 40rpx;
  text-align: center;
}
.success-icon {
  width: 192rpx;
  height: 192rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #10B981;
  background: #dcfce7;
  font-size: 96rpx;
  font-weight: 900;
}
.success-title { color: #1f2937; font-size: 40rpx; font-weight: 900; }
.success-desc { max-width: 560rpx; color: #6b7280; font-size: 24rpx; line-height: 1.65; }
.success-summary {
  width: 100%;
  display: grid;
  gap: 20rpx;
  padding: 36rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.05);
  text-align: left;
}
.success-actions {
  width: 100%;
  display: grid;
  gap: 28rpx;
  margin-top: 20rpx;
}
/* 上线前自适应收口：预约成功页长字段保持换行。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
