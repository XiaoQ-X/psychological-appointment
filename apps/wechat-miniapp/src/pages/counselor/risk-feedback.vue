<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">风险处理反馈</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view :class="['cp-status-card', statusTone]"><text class="cp-status-title">{{ riskText(record.level) }}</text><text class="cp-status-desc">{{ record.source || "风险筛查" }} {{ record.score ?? "--" }} 分，{{ processText(record.processStatus) }}</text></view>
          <view v-if="loading" class="sp-card cp-section-card"><text class="cp-section-title">正在读取风险记录...</text></view>
          <view v-else-if="errorText" class="sp-card cp-section-card error-card">
            <text class="cp-section-title">{{ errorText }}</text>
            <button class="error-return-btn" @click="back">返回风险记录</button>
          </view>
          <template v-else>
            <view class="sp-card cp-section-card"><text class="cp-section-title">学生信息</text><view class="cp-compact-user"><image class="cp-avatar sm" mode="aspectFill" :src="studentAvatar" /><view><text class="cp-name">{{ record.student?.name || "学生" }}</text><text class="cp-desc">{{ studentDesc }}</text></view></view></view>
            <view class="sp-card cp-section-card"><text class="cp-section-title">风险详情</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">提交时间</text><text class="cp-desc">{{ formatDateTime(record.createdAt) }}</text></view><view class="sp-field"><text class="sp-label">处理状态</text><text class="cp-desc">{{ processText(record.processStatus) }}</text></view><view class="sp-field"><text class="sp-label">已有反馈</text><text class="cp-desc">{{ safeVisibleText(record.feedback, "暂无反馈") }}</text></view></view></view>
            <view class="sp-card cp-section-card"><text class="cp-section-title">反馈记录</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">处理方式</text><view class="cp-option-grid two"><button v-for="item in methods" :key="item" :class="['cp-option', { active: method === item }]" @click="method = item">{{ item }}</button></view></view><view class="sp-field"><text class="sp-label">处理说明</text><textarea v-model="feedback" class="sp-textarea" placeholder="请填写处理说明，例如已联系学生、约定面谈、建议转介等" /></view></view></view>
          </template>
        </view></scroll-view></view>
    <view class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting || loading || !!errorText" @click="submit">提交反馈</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorRiskRecord, submitRiskFeedback } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { safeBackCounselor } from "@/utils/navigation";

const riskId = ref("");
const loading = ref(false);
const submitting = ref(false);
const errorText = ref("");
const record = ref({});
const method = ref("电话联系");
const feedback = ref("");
const methods = ["电话联系", "面谈跟进", "通知辅导员", "建议转介"];

const statusTone = computed(() => (["crisis", "high"].includes(record.value.level) ? "danger" : ""));
const studentInitial = computed(() => (record.value.student?.name || "学").slice(0, 1));
const studentAvatar = computed(() => resolveApiAssetUrl(record.value.student?.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const studentDesc = computed(() => {
  const student = record.value.student || {};
  return [student.college, student.grade, maskPhone(student.phone)].filter(Boolean).join(" · ") || "学生信息待完善";
});

onLoad((query = {}) => {
  riskId.value = query.id || "";
  loadRiskRecord();
});

async function loadRiskRecord() {
  if (!riskId.value) {
    errorText.value = "缺少风险记录ID";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    record.value = await getCounselorRiskRecord(riskId.value);
    feedback.value = isHistoricalTestText(record.value.feedback) ? "" : record.value.feedback || "";
  } catch (error) {
    record.value = {};
    errorText.value = error.message || "风险记录读取失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function back() { safeBackCounselor("/pages/counselor/risk-records"); }

async function submit() {
  const text = feedback.value.trim();
  if (!text) {
    uni.showToast({ title: "请填写处理说明", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    record.value = await submitRiskFeedback({
      riskAssessmentId: riskId.value,
      feedback: `${method.value}：${text}`
    });
    uni.showToast({ title: "风险反馈已提交", icon: "success" });
    setTimeout(() => back(), 600);
  } catch (error) {
    uni.showToast({ title: error.message || "风险反馈提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function riskText(level) {
  return { crisis: "危机风险提醒", high: "高风险提醒", medium: "中风险跟进", low: "低风险观察" }[level] || "风险处理反馈";
}

function processText(status) {
  return { open: "待处理", following: "跟进中", handled: "已处理", closed: "已关闭" }[status] || "待处理";
}

function maskPhone(value) {
  if (!value) return "";
  return value.replace(/^(\d{3})\d{4}(\d+)/, "$1****$2");
}

function formatDateTime(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function safeVisibleText(value, fallback) {
  const text = String(value || "").trim();
  if (!text || isHistoricalTestText(text)) return fallback;
  return text;
}

function isHistoricalTestText(value) {
  return /\?{3,}|E2E|Batch|Fixed|regression/i.test(String(value || ""));
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.cp-status-title,
.cp-status-desc,
.cp-section-title,
.cp-name,
.cp-desc,
.sp-label,
.sp-textarea {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.sp-textarea {
  min-height: 180rpx;
}

.error-card {
  border-color: #FECACA;
  color: #B91C1C;
  background: #FEF2F2;
}

.error-return-btn {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
