<template>
  <view class="mobile-container assessment-result-page">
    <status-bar />
    <page-header title="测评结果" show-back @back="goBack" />

    <scroll-view class="result-content" scroll-y enhanced :show-scrollbar="false">
      <view class="result-inner">
        <view class="result-main-card">
          <view class="score-circle">
            <view class="score-inner">
              <text class="score-number">{{ result.score }}</text>
              <text class="score-unit">分</text>
            </view>
          </view>
          <text class="result-title">{{ result.title }}</text>
          <text class="result-desc">{{ result.desc }}</text>
        </view>

        <view class="advice-card">
          <text class="advice-title">建议</text>
          <view class="advice-note">
            <text>{{ result.suggestion }}</text>
          </view>
        </view>

        <view class="result-actions">
          <button class="primary-action" @click="go('/pages/student/counselors')">预约咨询师</button>
          <button class="secondary-action" @click="go('/pages/student/assessment-history')">查看测评历史</button>
          <button class="plain-action" @click="go('/pages/student/assessments')">返回测评列表</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";

const result = ref({
  score: 0,
  title: "暂无测评结果",
  desc: "完成测评后会显示你的测评结果。",
  suggestion: "测评结果仅供心理健康服务参考，不作为诊断依据。"
});

onLoad(() => {
  const stored = uni.getStorageSync("student_latest_assessment_result");
  if (stored?.result) {
    result.value = normalizeResult(stored.result, stored.assessment);
  }
});

function normalizeResult(item = {}, assessment = {}) {
  const levelText = levelLabel(item.level);
  return {
    score: Number(item.score || 0),
    title: `${assessment.title || "心理测评"} · ${levelText}`,
    desc: `根据本次测评结果，你当前的风险等级为${levelText}。`,
    suggestion: item.suggestion || item.summary || "建议保持规律作息，如持续不适请预约心理咨询。"
  };
}

function levelLabel(level) {
  const map = {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    crisis: "危机风险"
  };
  return map[level] || "结果待确认";
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}

function goBack() {
  safeBackStudent("/pages/student/assessments");
}
</script>

<style scoped>
.assessment-result-page {
  background: #f8fafc;
}

.result-content {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.result-inner {
  padding: 40rpx;
  text-align: center;
}

.result-main-card {
  padding: 48rpx 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.score-circle {
  width: 220rpx;
  height: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 16rpx auto 28rpx;
  border: 8rpx solid #fed7aa;
  border-radius: 999rpx;
  background: #fff7ed;
}

.score-inner {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
}

.score-number {
  color: #f97316;
  font-size: 60rpx;
  font-weight: 900;
}

.score-unit {
  color: #fb923c;
  font-size: 24rpx;
  font-weight: 700;
}

.result-title {
  display: block;
  color: #ea580c;
  font-size: 34rpx;
  font-weight: 900;
}

.result-desc {
  display: block;
  margin-top: 18rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.7;
  text-align: left;
}

.advice-card {
  margin-top: 32rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  text-align: left;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.advice-title {
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.advice-note {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #fff7ed;
}

.advice-note text {
  color: #c2410c;
  font-size: 24rpx;
  line-height: 1.65;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 48rpx;
  padding-bottom: 40rpx;
}

.primary-action,
.secondary-action,
.plain-action {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.primary-action {
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}

.secondary-action {
  color: #4A90D9;
  border: 1rpx solid #bfdbfe;
  background: #eff6ff;
}

.plain-action {
  color: #6b7280;
  border: 1rpx solid #e5e7eb;
  background: #fff;
}
/* 上线前自适应收口：测评结果建议文本不撑破卡片。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
