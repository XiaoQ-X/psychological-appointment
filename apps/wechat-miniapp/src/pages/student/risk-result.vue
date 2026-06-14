<template>
  <view class="mobile-container sp-page">
    <status-bar />
    <page-header title="评估结果" show-back @back="back" />

    <scroll-view class="sp-content risk-result-scroll" scroll-y enhanced :show-scrollbar="false">
      <view class="risk-result-wrap">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view class="risk-warning">
          <view class="risk-warning-icon">!</view>
          <view class="risk-warning-copy">
            <text class="risk-warning-title">{{ riskCopy.title }}</text>
            <text class="risk-warning-desc">{{ riskCopy.desc }}</text>
          </view>
        </view>

        <view v-if="hasRiskResult" class="risk-score-block">
          <view class="risk-score-circle">
            <text class="risk-score-num">{{ risk.score }}</text>
            <text class="risk-score-unit">总分 (0-27)</text>
          </view>
          <text class="risk-level-pill">{{ riskCopy.levelText }}</text>
        </view>
        <view v-else class="risk-empty-block">
          <text class="risk-empty-title">暂无自评结果</text>
          <text class="risk-empty-desc">完成自评后，系统会在这里显示结果与建议。</text>
        </view>

        <view class="risk-card risk-advice-card">
          <text class="risk-card-title">{{ hasRiskResult ? "专业建议" : "后续建议" }}</text>
          <text class="risk-paragraph">{{ riskCopy.advice }}</text>
          <text class="risk-paragraph">{{ hasRiskResult ? "我们建议你：" : "你可以：" }}</text>
          <text v-for="item in riskCopy.actions" :key="item" class="risk-paragraph">{{ item }}</text>
        </view>

        <view class="risk-card risk-emergency-card">
          <view class="risk-card-title danger-title">
            <view class="mini-icon alert"></view>
            <text>紧急资源</text>
          </view>
          <view class="emergency-item">
            <view>
              <text class="emergency-name">学校心理中心热线</text>
              <text class="emergency-phone">010-8888-8888</text>
              <text class="emergency-time">24小时</text>
            </view>
            <button class="emergency-call">联系</button>
          </view>
          <view class="emergency-item">
            <view>
              <text class="emergency-name">全国危机干预热线</text>
              <text class="emergency-phone">400-161-9995</text>
            </view>
            <button class="emergency-call">联系</button>
          </view>
          <view class="emergency-actions">
            <button class="danger-primary" @click="go('/pages/student/emergency')">开启紧急帮助页</button>
            <button class="danger-secondary">一键联系</button>
          </view>
        </view>

        <view class="risk-actions">
          <button class="sp-primary" @click="go('/pages/student/counselors')">一键预约咨询师</button>
          <button class="sp-secondary" @click="goHome">回到首页</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";

// UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。
const risk = ref(null);

const hasRiskResult = computed(() => Boolean(risk.value && (risk.value.score !== undefined || risk.value.level)));

const riskCopy = computed(() => {
  if (!hasRiskResult.value) {
    return {
      title: "暂无评估结果",
      desc: "请先完成自评，再查看具体风险提示",
      levelText: "未评估",
      advice: "当前没有可用于判断风险的自评结果，系统不会默认判定低风险。",
      actions: ["1. 如需了解近期状态，可先完成一次自评；", "2. 如已经感到明显困扰，可直接预约咨询；", "3. 如有紧急风险，请立即打开紧急帮助页。"]
    };
  }
  const score = Number(risk.value?.score || 0);
  const level = risk.value?.level || (score >= 20 ? "crisis" : score >= 15 ? "high" : score >= 8 ? "medium" : "low");
  if (level === "crisis" || score >= 20) {
    return {
      title: "你的评估结果提示需要立即关注",
      desc: "建议你尽快联系心理中心或紧急支持资源",
      levelText: "危机风险倾向",
      advice: "您的得分显示您近期可能正承受较强烈的情绪困扰。请优先保障自身安全，并尽快寻求专业支持。",
      actions: ["1. 立即联系心理中心或可信任的老师、家人；", "2. 如有危急情况，请拨打 110 或前往最近医院急诊；", "3. 在安全前提下，预约心理咨询师进行面对面评估。"]
    };
  }
  if (level === "high" || score >= 15) {
    return {
      title: "你的评估结果提示需要关注",
      desc: "我们建议你优先联系心理中心获取专业支持",
      levelText: "高风险倾向",
      advice: "您的得分显示您近期可能正承受着较为明显的情绪困扰。请务必优先保障自身安全。",
      actions: ["1. 优先联系心理中心或紧急资源；", "2. 如有危急情况，请拨打 110 或前往最近医院急诊；", "3. 在安全前提下，预约心理咨询师进行面对面评估。"]
    };
  }
  if (level === "medium" || score >= 8) {
    return {
      title: "你的评估结果提示需要留意",
      desc: "建议你尽快预约心理咨询，获得更稳定的支持",
      levelText: "中风险倾向",
      advice: "您的得分显示近期有一定情绪压力，建议尽早与心理老师沟通。",
      actions: ["1. 保持规律作息并记录情绪变化；", "2. 与可信任的同学、老师或家人沟通；", "3. 预约心理咨询师进行进一步评估。"]
    };
  }
  return {
    title: "你的评估结果整体平稳",
    desc: "可按当前状态继续预约常规咨询",
    levelText: "低风险",
    advice: "您的得分显示当前风险较低，可继续关注自己的情绪状态并按需预约咨询。",
    actions: ["1. 保持规律作息；", "2. 遇到压力及时寻求支持；", "3. 如有需要，可预约心理咨询师。"]
  };
});

onLoad(() => {
  const latest = uni.getStorageSync("latest_risk_result");
  if (latest) {
    risk.value = latest;
  }
});

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}

function back() {
  safeBackStudent("/pages/student/home");
}
</script>

<style scoped>
.risk-result-scroll {
  background: #f8fafc;
}

.risk-result-wrap {
  padding: 32rpx 40rpx 64rpx;
}

.risk-warning {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  border: 1rpx solid #fecaca;
  border-radius: 32rpx;
  background: #fef2f2;
}

.risk-warning-icon {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #ef4444;
  background: #fee2e2;
  font-size: 34rpx;
  font-weight: 900;
}

.risk-warning-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.risk-warning-title {
  color: #b91c1c;
  font-size: 28rpx;
  font-weight: 800;
}

.risk-warning-desc {
  color: #dc2626;
  font-size: 24rpx;
  line-height: 1.5;
}

.risk-score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36rpx 0 40rpx;
}

.risk-empty-block {
  display: grid;
  gap: 12rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 32rpx;
  border: 1rpx dashed #cbd5e1;
  border-radius: 28rpx;
  background: #fff;
  text-align: center;
}

.risk-empty-title {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 900;
}

.risk-empty-desc {
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.5;
}

.risk-score-circle {
  width: 240rpx;
  height: 240rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  border: 16rpx solid #ef4444;
  border-radius: 999rpx;
  background: #fef2f2;
}

.risk-score-num {
  color: #ef4444;
  font-size: 64rpx;
  line-height: 1;
  font-weight: 900;
}

.risk-score-unit {
  margin-top: 10rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.risk-level-pill {
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  color: #ef4444;
  background: #fef2f2;
  font-size: 28rpx;
  font-weight: 800;
}

.risk-card {
  width: 100%;
  padding: 40rpx;
  margin-bottom: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.risk-advice-card {
  border-color: #fee2e2;
}

.risk-card-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.danger-title {
  color: #dc2626;
}

.danger-title .mini-icon {
  width: 36rpx;
  height: 36rpx;
  color: #ef4444;
}

.risk-paragraph {
  display: block;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.75;
  margin-bottom: 12rpx;
}

.risk-emergency-card {
  border: 2rpx solid #fecaca;
}

.emergency-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-radius: 24rpx;
  background: #fef2f2;
}

.emergency-name {
  display: block;
  color: #1f2937;
  font-size: 24rpx;
  font-weight: 800;
}

.emergency-phone {
  display: block;
  margin-top: 8rpx;
  color: #dc2626;
  font-size: 30rpx;
  font-weight: 900;
}

.emergency-time {
  display: block;
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.emergency-call {
  width: 88rpx;
  height: 88rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #fff;
  background: #ef4444;
  font-size: 22rpx;
  font-weight: 800;
}

.emergency-actions,
.risk-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.danger-primary,
.danger-secondary {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 800;
}

.danger-primary {
  color: #fff;
  background: #ef4444;
}

.danger-secondary {
  color: #dc2626;
  border: 1rpx solid #fecaca;
  background: #fff;
}
/* 上线前自适应收口：风险建议和说明文本自动换行。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
