<template>
  <view class="mobile-container quiz-page" :style="layoutStyle">
    <status-bar />
    <page-header title="心理测评" show-back @back="goBack" />

    <scroll-view class="quiz-content" scroll-y enhanced :show-scrollbar="false">
      <view class="quiz-inner">
        <view class="quiz-progress-card">
          <view class="quiz-progress-head">
            <text class="quiz-scale-title">{{ assessment.title }}</text>
            <text class="quiz-count">{{ questionIndex + 1 }}/{{ questions.length }}</text>
          </view>
          <view class="quiz-track">
            <view class="quiz-bar" :style="{ width: progressWidth }"></view>
          </view>
        </view>

        <view v-if="loading || errorText || !questions.length" class="question-card">
          <text class="question-title">{{ loading ? "题目加载中" : errorText || "暂无测评题目" }}</text>
        </view>

        <view v-else class="question-card">
          <text class="question-title">{{ questionIndex + 1 }}. {{ currentQuestion.title }}</text>
          <view class="option-list">
            <button
              v-for="option in currentOptions"
              :key="option.key"
              :class="['option-btn', { active: selectedAnswers[questionIndex]?.key === option.key }]"
              @click="selectOption(option)"
            >
              {{ option.label }}
            </button>
          </view>
        </view>

        <view class="quiz-tip-card">
          <text class="tip-title">答题说明</text>
          <text class="tip-text">请根据过去两周的真实感受作答。测评结果仅供心理健康服务参考，不作为诊断依据。</text>
        </view>

        <view class="quiz-actions">
          <button class="quiz-exit" @click="goBack">退出测评</button>
          <button class="quiz-submit" :loading="submitting" :disabled="submitting || loading || errorText || !questions.length" @click="nextOrSubmit">
            {{ questionIndex === questions.length - 1 ? "提交问卷" : "下一题" }}
          </button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getAssessmentDetail, submitAssessmentResult } from "../../api/student";
import { replacePage, safeBackStudent } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const layoutStyle = getLayoutVars();

const assessmentId = ref("");
const loading = ref(false);
const submitting = ref(false);
const errorText = ref("");
const assessment = ref({
  id: "",
  title: "心理测评",
  description: ""
});
const questionIndex = ref(0);
const selectedAnswers = ref({});
const questions = ref([]);

const currentQuestion = computed(() => questions.value[questionIndex.value] || { title: "", options: [] });
const currentOptions = computed(() => currentQuestion.value.options || []);
const progressWidth = computed(() => {
  const total = questions.value.length || 1;
  return `${Math.round(((questionIndex.value + 1) / total) * 100)}%`;
});

onLoad((query = {}) => {
  assessmentId.value = query.id || "";
  loadAssessment();
});

async function loadAssessment() {
  if (!assessmentId.value) {
    errorText.value = "缺少测评 ID";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getAssessmentDetail(assessmentId.value);
    assessment.value = {
      id: detail.id,
      title: detail.title || "心理测评",
      description: detail.description || ""
    };
    questions.value = normalizeQuestions(detail.questions);
  } catch (error) {
    errorText.value = error.message || "测评题目加载失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectOption(option) {
  selectedAnswers.value = {
    ...selectedAnswers.value,
    [questionIndex.value]: option
  };
}

async function nextOrSubmit() {
  if (!selectedAnswers.value[questionIndex.value]) {
    uni.showToast({ title: "请选择一个选项", icon: "none" });
    return;
  }
  if (questionIndex.value < questions.value.length - 1) {
    questionIndex.value += 1;
    return;
  }
  await submitResult();
}

async function submitResult() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const answers = questions.value.map((question, index) => {
      const selected = selectedAnswers.value[index] || {};
      return {
        questionId: question.id,
        title: question.title,
        selected: selected.label || "",
        value: Number(selected.value || 0)
      };
    });
    const score = answers.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const result = await submitAssessmentResult({
      assessmentId: assessmentId.value,
      score,
      answers,
      suggestion: suggestionForScore(score)
    });
    uni.setStorageSync("student_latest_assessment_result", {
      result,
      assessment: assessment.value
    });
    replacePage(`/pages/student/assessment-result?id=${result.id}`);
  } catch (error) {
    uni.showToast({ title: error.message || "测评提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function normalizeQuestions(list = []) {
  return (Array.isArray(list) ? list : []).map((question, index) => ({
    id: question.id || String(index + 1),
    title: question.title || question.question || question.text || `第 ${index + 1} 题`,
    options: normalizeOptions(question.options || question.choices || [])
  }));
}

function normalizeOptions(list = []) {
  return (Array.isArray(list) ? list : []).map((option, index) => {
    if (typeof option === "string") {
      return { key: `${index}-${option}`, label: option, value: index };
    }
    return {
      key: option.id || option.value || option.label || String(index),
      label: option.label || option.title || option.text || String(option.value ?? index),
      value: Number(option.value ?? option.score ?? index)
    };
  });
}

function suggestionForScore(score) {
  if (score >= 20) return "建议尽快预约心理咨询师，获得进一步支持。";
  if (score >= 10) return "建议关注近期状态，适当进行放松训练，必要时预约咨询。";
  return "建议保持规律作息和稳定社交，继续关注自己的心理状态。";
}

function goBack() {
  safeBackStudent("/pages/student/assessments");
}
</script>

<style scoped>
.quiz-page {
  background: #f8fafc;
}

.quiz-content {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.quiz-inner {
  padding: 40rpx;
}

.quiz-progress-card {
  margin-bottom: 48rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: #eff6ff;
}

.quiz-progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 18rpx;
}

.quiz-scale-title {
  color: #1e3a8a;
  font-size: 28rpx;
  font-weight: 900;
}

.quiz-count {
  color: #2563eb;
  font-size: 24rpx;
  font-weight: 800;
}

.quiz-track {
  height: 12rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #bfdbfe;
}

.quiz-bar {
  height: 100%;
  border-radius: 999rpx;
  background: #3b82f6;
}

.question-card {
  margin-bottom: 32rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.question-title {
  display: block;
  color: #1f2937;
  font-size: 30rpx;
  line-height: 1.55;
  font-weight: 900;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-top: 48rpx;
}

.option-btn {
  width: calc((100% - 24rpx) / 2);
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  color: #6b7280;
  background: #fff;
  font-size: 24rpx;
  font-weight: 800;
}

.option-btn.active {
  color: #fff;
  border-color: #4A90D9;
  background: #4A90D9;
}

.quiz-tip-card {
  margin-bottom: 40rpx;
  padding: 32rpx;
  border-radius: 28rpx;
  background: #fff;
}

.tip-title,
.tip-text {
  display: block;
}

.tip-title {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.tip-text {
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.65;
}

.quiz-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-bottom: 32rpx;
}

.quiz-exit,
.quiz-submit {
  flex: 1;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 900;
}

.quiz-exit {
  color: #6b7280;
  border: 1rpx solid #e5e7eb;
  background: #fff;
}

.quiz-submit {
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}
/* 上线前自适应收口：题目、选项和按钮长文本保持换行。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
