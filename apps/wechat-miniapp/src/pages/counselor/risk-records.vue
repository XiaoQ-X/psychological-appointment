<template>
  <view class="mobile-container sp-page risk-records-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header center">
      <button class="sp-back" @click="back">
        <view class="mini-icon chevron-left"></view>
      </button>
      <text class="sp-header-title">评估记录管理</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="risk-stack">
          <view class="risk-filter-block">
            <view class="risk-filter-row">
              <button v-for="item in levelFilters" :key="item.key" :class="['filter-btn', { active: activeLevel === item.key }]" @click="selectLevel(item.key)">
                {{ item.label }}
              </button>
            </view>
            <view class="risk-filter-row">
              <button v-for="item in statusFilters" :key="item.key" :class="['filter-btn', { active: activeStatus === item.key }]" @click="selectStatus(item.key)">
                {{ item.label }}
              </button>
            </view>
          </view>
          <view class="summary-line">
            <text>共{{ records.length }}条记录</text>
            <text>{{ filterSummary }}</text>
          </view>

          <view v-if="loading" class="risk-card low">
            <text class="risk-note">正在读取风险记录...</text>
          </view>

          <view v-else-if="errorText || !records.length" class="risk-card low">
            <text class="risk-note">{{ errorText || "暂无风险记录" }}</text>
          </view>

          <block v-else>
            <view v-for="record in records" :key="record.id" :class="['risk-card', riskTone(record.level)]" @click="goFeedback(record.id)">
              <view class="risk-head">
                <view class="person-row">
                  <view :class="['avatar', avatarTone(record.level)]">{{ initial(record.student?.name) }}</view>
                  <view>
                    <text class="name">{{ record.student?.name || "学生" }}</text>
                    <text class="desc">{{ studentMeta(record.student) }} · {{ formatDate(record.createdAt) }}提交</text>
                  </view>
                </view>
                <text :class="['risk-pill', riskTone(record.level)]">{{ riskText(record.level) }}</text>
              </view>
              <view class="scale-box">
                <text>{{ record.source || "风险筛查" }}</text>
                <text :class="['score', scoreTone(record.level)]">{{ record.score }}分</text>
              </view>
              <text class="risk-note">{{ riskNote(record) }}</text>
              <view class="card-actions">
                <button :class="['primary-btn', { soft: !['high', 'crisis'].includes(record.level) }]" @click.stop="goFeedback(record.id)">
                  {{ record.feedback ? "查看反馈" : "填写反馈" }}
                </button>
                <button class="ghost-btn" @click.stop="goFeedback(record.id)">查看详情</button>
              </view>
            </view>
          </block>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCounselorRiskRecords } from "../../api/counselor";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const errorText = ref("");
const records = ref([]);
const activeLevel = ref("");
const activeStatus = ref("");

const levelFilters = [
  { key: "", label: "全部等级" },
  { key: "crisis", label: "危机" },
  { key: "high", label: "高风险" },
  { key: "medium", label: "中风险" },
  { key: "low", label: "低风险" }
];

const statusFilters = [
  { key: "", label: "全部状态" },
  { key: "open", label: "待处理" },
  { key: "following", label: "跟进中" },
  { key: "handled", label: "已处理" },
  { key: "closed", label: "已关闭" }
];

const filterSummary = computed(() => {
  const level = levelFilters.find((item) => item.key === activeLevel.value)?.label || "全部等级";
  const status = statusFilters.find((item) => item.key === activeStatus.value)?.label || "全部状态";
  return `${level} · ${status}`;
});

onShow(() => {
  loadRiskRecords();
});

async function loadRiskRecords() {
  loading.value = true;
  errorText.value = "";
  try {
    const params = {};
    if (activeLevel.value) params.level = activeLevel.value;
    if (activeStatus.value) params.status = activeStatus.value;
    records.value = await getCounselorRiskRecords(params);
  } catch (error) {
    records.value = [];
    errorText.value = error.message || "风险记录读取失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectLevel(level) {
  activeLevel.value = level;
  loadRiskRecords();
}

function selectStatus(status) {
  activeStatus.value = status;
  loadRiskRecords();
}

function goFeedback(id) {
  goPage(`/pages/counselor/risk-feedback?id=${id}`);
}

function back() {
  safeBackCounselor("/pages/counselor/dashboard");
}

function initial(name = "学") {
  return name.slice(0, 1);
}

function studentMeta(student = {}) {
  return [student.college, student.grade].filter(Boolean).join(" · ") || student.studentNo || "学生信息待完善";
}

function riskText(level) {
  return { crisis: "危机风险", high: "高风险", medium: "中风险", low: "低风险" }[level] || "待评估";
}

function riskTone(level) {
  if (["crisis", "high"].includes(level)) return "high";
  if (level === "medium") return "medium";
  return "low";
}

function avatarTone(level) {
  if (["crisis", "high"].includes(level)) return "red";
  if (level === "medium") return "orange";
  return "blue";
}

function scoreTone(level) {
  if (["crisis", "high"].includes(level)) return "red";
  if (level === "medium") return "orange";
  return "green";
}

function riskNote(record = {}) {
  if (record.feedback) return `已反馈：${safeVisibleText(record.feedback, "历史反馈内容待整理")}`;
  if (["crisis", "high"].includes(record.level)) return "高风险记录需要尽快跟进并提交处理反馈。";
  if (record.level === "medium") return "建议结合预约咨询情况补充反馈。";
  return "建议持续关注学生状态变化。";
}

function safeVisibleText(value, fallback) {
  const text = String(value || "").trim();
  if (!text || isHistoricalTestText(text)) return fallback;
  return text;
}

function isHistoricalTestText(text) {
  return /\?{3,}|E2E|Batch|Fixed|regression/i.test(text);
}

function formatDate(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}
</script>

<style scoped>
.risk-records-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.risk-filter-block {
  display: grid;
  gap: 14rpx;
}

.risk-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-btn {
  min-width: 92rpx;
  height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 800;
}

.filter-btn.disabled {
  color: #94A3B8;
  background: #F1F5F9;
}

.filter-btn.active {
  color: #fff;
  background: #4A90D9;
}

.risk-stack {
  display: grid;
  gap: 22rpx;
  padding: 24rpx 32rpx 40rpx;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  color: #64748B;
  font-size: 23rpx;
}

.summary-line text {
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.risk-card {
  display: grid;
  gap: 20rpx;
  padding: 28rpx;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37,99,235,.06);
}

.risk-card.high {
  border-left: 8rpx solid #EF4444;
}

.risk-card.medium {
  border-left: 8rpx solid #F97316;
}

.risk-card.low {
  border-left: 8rpx solid #5EC4AC;
}

.risk-head,
.person-row,
.card-actions,
.scale-box {
  display: flex;
  align-items: center;
}

.risk-head {
  justify-content: space-between;
  gap: 18rpx;
}

.person-row {
  min-width: 0;
  gap: 18rpx;
}

.avatar {
  width: 76rpx;
  height: 76rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
}

.avatar.red { background: #EF4444; }
.avatar.orange { background: #F97316; }
.avatar.blue { background: #4A90D9; }

.name,
.desc {
  display: block;
}

.name {
  color: #111827;
  font-size: 27rpx;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.desc {
  margin-top: 6rpx;
  color: #94A3B8;
  font-size: 21rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.risk-pill {
  flex: none;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 900;
}

.risk-pill.high { color: #DC2626; background: #FEE2E2; }
.risk-pill.medium { color: #EA580C; background: #FFEDD5; }
.risk-pill.low { color: #16A34A; background: #DCFCE7; }

.scale-box {
  justify-content: space-between;
  padding: 20rpx;
  border-radius: 18rpx;
  color: #475569;
  background: #F8FAFC;
  font-size: 24rpx;
  font-weight: 800;
}

.score {
  font-size: 28rpx;
  font-weight: 900;
}

.score.red { color: #DC2626; }
.score.orange { color: #EA580C; }
.score.green { color: #16A34A; }

.risk-note {
  color: #64748B;
  font-size: 23rpx;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.card-actions {
  gap: 18rpx;
}

.primary-btn,
.ghost-btn {
  height: 72rpx;
  flex: 1;
  border-radius: 18rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.primary-btn {
  color: #fff;
  background: #EF4444;
}

.primary-btn.soft {
  background: #4A90D9;
}

.ghost-btn {
  color: #4A90D9;
  background: #EFF6FF;
}
</style>
