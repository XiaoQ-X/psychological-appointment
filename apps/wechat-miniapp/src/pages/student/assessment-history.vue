<template>
  <view class="mobile-container assessment-history-page">
    <status-bar />
    <page-header title="测评历史" show-back @back="goProfile" />

    <scroll-view class="history-filter" scroll-x enhanced :show-scrollbar="false">
      <view class="filter-row">
        <button
          v-for="item in filters"
          :key="item.key"
          :class="['filter-chip', { active: activeFilter === item.key }]"
          @click="selectFilter(item.key)"
        >
          {{ item.label }}
        </button>
      </view>
    </scroll-view>

    <view class="history-content-wrap">
      <scroll-view class="history-content" scroll-y enhanced :show-scrollbar="false">
        <view class="history-inner">
          <view v-if="loading" class="history-empty">
            <view class="empty-icon"><view class="mini-icon clipboard"></view></view>
            <text class="empty-title">测评历史加载中</text>
            <text class="empty-desc">请稍候</text>
          </view>

          <view v-else-if="filteredRecords.length" class="history-list">
            <view v-for="record in filteredRecords" :key="record.id" class="history-card">
              <view class="history-card-head">
                <view class="history-icon">
                  <view class="mini-icon clipboard"></view>
                </view>
                <view class="history-main">
                  <text class="history-title">{{ record.name }}</text>
                  <text class="history-date">完成时间：{{ record.date }}</text>
                </view>
              </view>

              <view class="score-row">
                <text class="score-text">得分：<text class="score-strong">{{ record.score }}</text></text>
                <text :class="['level-pill', record.level]">{{ record.levelText }}</text>
              </view>

              <view class="advice-box">
                <text>{{ record.advice }}</text>
              </view>

              <view class="history-card-footer">
                <button class="detail-link" @click="showDetail(record)">查看详情 →</button>
              </view>
            </view>
          </view>

          <view v-else class="history-empty">
            <view class="empty-icon"><view class="mini-icon clipboard"></view></view>
            <text class="empty-title">暂无测评记录</text>
            <text class="empty-desc">你还没有完成过心理测评</text>
            <button class="empty-action" @click="go('/pages/student/assessments')">去测评</button>
          </view>

          <view class="history-disclaimer">
            <text>测评结果仅供心理健康服务参考，不作为诊断依据。</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <bottom-tabbar role="student" active="profile" />
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getAssessmentResults } from "../../api/student";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const filters = [
  { key: "all", label: "全部" },
  { key: "month1", label: "近一月" },
  { key: "month3", label: "近三月" },
  { key: "high", label: "高风险" }
];

const loading = ref(false);
const records = ref([]);
const activeFilter = ref("all");

onShow(() => {
  loadHistory();
});

const filteredRecords = computed(() => {
  return records.value;
});

function selectFilter(key) {
  activeFilter.value = key;
  loadHistory();
}

async function loadHistory() {
  loading.value = true;
  try {
    const params = { page: 1, pageSize: 50 };
    if (activeFilter.value === "month1") params.days = 31;
    if (activeFilter.value === "month3") params.days = 93;
    if (activeFilter.value === "high") params.level = "high";
    const result = await getAssessmentResults(params);
    records.value = (Array.isArray(result?.items) ? result.items : []).map(normalizeRecord);
  } catch (error) {
    records.value = [];
    uni.showToast({ title: error.message || "测评历史加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeRecord(item = {}) {
  const level = normalizeLevel(item.level);
  return {
    id: item.id,
    name: item.assessmentTitle || "心理测评",
    date: formatDate(item.createdAt),
    rawCreatedAt: item.createdAt,
    score: String(item.score ?? 0),
    level,
    levelText: levelLabel(item.level),
    advice: safeVisibleText(item.summary || item.suggestion, "测评结果仅供心理健康服务参考。"),
    original: item
  };
}

function safeVisibleText(value, fallback) {
  const text = String(value || "").trim();
  if (!text || isHistoricalTestText(text)) return fallback;
  return text;
}

function isHistoricalTestText(text) {
  return /\?{3,}|E2E|Batch|Fixed|regression/i.test(text);
}

function normalizeLevel(level) {
  if (level === "medium") return "mid";
  return level || "low";
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

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function go(url) {
  goPage(url);
}

function goProfile() {
  goPrimaryPage("/pages/student/profile");
}

function showDetail(record) {
  uni.setStorageSync("student_latest_assessment_result", {
    result: record.original,
    assessment: { title: record.name }
  });
  go(`/pages/student/assessment-result?id=${record.id}`);
}
</script>

<style scoped>
.assessment-history-page {
  background: #f8fafc;
}

.history-filter {
  flex: none;
  width: 100%;
  padding: 24rpx 0 18rpx;
  background: #fff;
  white-space: nowrap;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  padding: 0 40rpx;
}

.filter-chip {
  min-width: 112rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 28rpx;
  border-radius: 999rpx;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 24rpx;
  font-weight: 800;
}

.filter-chip.active {
  color: #fff;
  background: #4A90D9;
}

.history-content-wrap {
  flex: 1;
  min-height: 0;
}

.history-content {
  height: 100%;
  padding-bottom: 144rpx;
}

.history-inner {
  padding: 32rpx 40rpx 40rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.history-card {
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.history-card-head {
  display: flex;
  gap: 24rpx;
  margin-bottom: 28rpx;
}

.history-icon {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #4A90D9;
  background: #eff6ff;
}

.history-icon .mini-icon,
.empty-icon .mini-icon {
  width: 48rpx;
  height: 48rpx;
}

.history-main {
  flex: 1;
  min-width: 0;
}

.history-title,
.history-date,
.score-text,
.advice-box text {
  display: block;
}

.history-title {
  color: #1f2937;
  font-size: 28rpx;
  line-height: 1.4;
  font-weight: 900;
}

.history-date {
  margin-top: 6rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.score-text {
  color: #4b5563;
  font-size: 24rpx;
}

.score-strong {
  color: #1f2937;
  font-weight: 900;
}

.level-pill {
  padding: 6rpx 20rpx;
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 800;
}

.level-pill.high {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.level-pill.mid {
  color: #d97706;
  border-color: #fde68a;
  background: #fffbeb;
}

.level-pill.low {
  color: #16a34a;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.advice-box {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f9fafb;
}

.advice-box text {
  color: #6b7280;
  font-size: 22rpx;
  line-height: 1.6;
}

.history-card-footer {
  margin-top: 20rpx;
  text-align: right;
}

.detail-link {
  color: #4A90D9;
  background: transparent;
  font-size: 24rpx;
  font-weight: 800;
}

.history-empty {
  padding: 96rpx 40rpx;
  text-align: center;
}

.empty-icon {
  width: 128rpx;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32rpx;
  border-radius: 999rpx;
  color: #cbd5e1;
  background: #f1f5f9;
}

.empty-title,
.empty-desc {
  display: block;
}

.empty-title {
  color: #9ca3af;
  font-size: 32rpx;
  font-weight: 900;
}

.empty-desc {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.empty-action {
  min-width: 176rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 36rpx auto 0;
  padding: 0 40rpx;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 800;
}

.history-disclaimer {
  padding: 32rpx 0 20rpx;
  text-align: center;
}

.history-disclaimer text {
  color: #d1d5db;
  font-size: 20rpx;
}
/* 上线前自适应收口：测评历史长标题和结果摘要保持卡片自适应。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
