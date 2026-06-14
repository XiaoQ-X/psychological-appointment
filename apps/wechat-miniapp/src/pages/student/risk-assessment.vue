<template>
  <view class="mobile-container sp-page">
    <status-bar />
    <page-header title="心理状态自评" show-back @back="back" />

    <scroll-view class="sp-content risk-scroll" scroll-y enhanced :show-scrollbar="false">
      <view class="risk-wrap">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view class="risk-intro-card">
          <text class="risk-intro-title">PHQ-9 抑郁筛查量表</text>
          <text class="risk-intro-desc">在过去的两个星期里，你有多大程度受到以下问题的困扰？请根据你的真实感受作答。</text>
        </view>

        <view class="risk-question-list">
          <view v-for="(question, index) in questions" :key="question" class="risk-question">
            <text class="risk-question-title">{{ index + 1 }}. {{ question }}</text>
            <view class="risk-option-grid">
              <button
                v-for="option in options"
                :key="option.label"
                :class="['risk-option', answers[index] === option.value ? 'active' : '']"
                @click="answers[index] = option.value"
              >
                {{ option.label }}
              </button>
            </view>
          </view>
        </view>

        <button class="risk-submit" :loading="submitting" :disabled="submitting" @click="submitRisk">提交问卷</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { reactive, ref } from "vue";
import { submitRiskAssessment } from "../../api/student";
import { goPage, replacePage, safeBackStudent } from "@/utils/navigation";

const questions = [
  "做事时提不起劲或没有兴趣？",
  "感到心情低落、沮丧或绝望？",
  "入睡困难、睡得不稳或睡得太多？",
  "感觉疲倦或没有活力？",
  "食欲不振或吃太多？",
  "觉得自己很糟，或觉得自己很失败，或让自己或家人失望？",
  "对事物专注有困难，例如阅读报纸或看电视时？",
  "动作或说话速度缓慢到别人已经察觉，或相反，烦躁或坐立不安、动来动去的情况更胜于平常？",
  "有不如死掉或用某种方式伤害自己的念头？"
];

const options = [
  { label: "完全不会", value: 0 },
  { label: "好几天", value: 1 },
  { label: "超过一半", value: 2 },
  { label: "几乎每天", value: 3 }
];
const answers = reactive(questions.map(() => ""));
const submitting = ref(false);

async function submitRisk() {
  if (answers.some((item) => item === "")) {
    uni.showToast({ title: "请完成全部题目", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const payloadAnswers = questions.map((question, index) => {
      const value = Number(answers[index]);
      const option = options.find((item) => item.value === value);
      return { question, value, selected: option?.label || "" };
    });
    const score = payloadAnswers.reduce((sum, item) => sum + item.value, 0);
    const result = await submitRiskAssessment({ answers: payloadAnswers, score });
    uni.setStorageSync("latest_risk_result", result);
    replacePage(`/pages/student/risk-result?id=${result?.id || ""}`);
  } catch (error) {
    uni.showToast({ title: error.message || "风险筛查提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function go(url) {
  goPage(url);
}

function back() {
  safeBackStudent("/pages/student/home");
}
</script>

<style scoped>
.risk-scroll {
  background: #f8fafc;
}

.risk-wrap {
  padding: 40rpx 40rpx 64rpx;
}

.risk-intro-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
  border-radius: 32rpx;
  background: #eff6ff;
}

.risk-intro-title {
  color: #1e3a8a;
  font-size: 28rpx;
  font-weight: 800;
}

.risk-intro-desc {
  color: #1d4ed8;
  font-size: 20rpx;
  line-height: 1.65;
}

.risk-question-list {
  display: flex;
  flex-direction: column;
  gap: 64rpx;
}

.risk-question-title {
  display: block;
  margin-bottom: 32rpx;
  color: #1f2937;
  font-size: 28rpx;
  line-height: 1.45;
  font-weight: 800;
}

.risk-option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.risk-option {
  width: calc(50% - 12rpx);
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  color: #4b5563;
  background: #fff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, .03);
}

.risk-option.active {
  color: #fff;
  border-color: #4A90D9;
  background: #4A90D9;
  box-shadow: 0 10rpx 18rpx rgba(74, 144, 217, .16);
}

.risk-submit {
  margin-top: 48rpx;
  width: 100%;
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 32rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 14rpx 28rpx rgba(74, 144, 217, .18);
}
/* 上线前自适应收口：题目和选项长文本不撑破卡片。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
