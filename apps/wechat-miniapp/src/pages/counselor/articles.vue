<template>
  <view class="mobile-container sp-page articles-page">
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
      <text class="sp-header-title">资讯管理</text>
      <button class="add-btn disabled" disabled>+</button>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="article-stack">
          <view class="notice-card">
            <text class="notice-title">内容维护说明</text>
            <text class="notice-text">当前咨询师端展示本人资讯记录，发布、编辑、下架和删除能力暂未开放。</text>
          </view>

          <view class="manage-summary">
            <view>
              <text class="summary-num">{{ publishedCount }}</text>
              <text class="summary-label">已发布</text>
            </view>
            <view>
              <text class="summary-num orange">{{ draftCount }}</text>
              <text class="summary-label">草稿</text>
            </view>
            <view>
              <text class="summary-num green">{{ totalViews }}</text>
              <text class="summary-label">总阅读</text>
            </view>
          </view>

          <view class="line-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="line-tab"
              :class="{ active: activeStatus === tab.key }"
              @click="selectStatus(tab.key)"
            >
              {{ tab.label }}
            </button>
          </view>

          <view v-if="loading" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon newspaper"></view></view>
            <text>正在读取资讯记录...</text>
          </view>

          <view v-else-if="error" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon newspaper"></view></view>
            <text>{{ error }}</text>
          </view>

          <template v-else-if="filteredArticles.length">
            <view
              v-for="article in filteredArticles"
              :key="article.id"
              class="article-card"
            >
              <view class="cover" :class="coverClass(article.status)">
                <view class="mini-icon newspaper"></view>
              </view>
              <view class="article-main">
                <view class="article-head">
                  <text class="article-title">{{ article.title || "未命名资讯" }}</text>
                  <text class="status" :class="statusClass(article.status)">{{ statusText(article.status) }}</text>
                </view>
                <text class="article-meta">{{ article.category || "心理科普" }} · 阅读 {{ article.viewCount || 0 }} · {{ formatDate(article.updatedAt || article.createdAt) }}</text>
                <text class="article-summary">{{ article.summary || "暂无摘要" }}</text>
                <view class="article-actions">
                  <button class="article-action disabled" disabled>编辑未开放</button>
                  <button class="article-action disabled" disabled>{{ article.status === "published" ? "下架未开放" : "发布未开放" }}</button>
                  <button class="article-action danger disabled" disabled>删除未开放</button>
                </view>
              </view>
            </view>
          </template>

          <view v-else class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon newspaper"></view></view>
            <text>{{ emptyText }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCounselorArticles } from "../../api/counselor";
import { safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const error = ref("");
const articles = ref([]);
const activeStatus = ref("");

const tabs = [
  { key: "", label: "全部" },
  { key: "published", label: "已发布" },
  { key: "draft", label: "草稿" },
  { key: "archived", label: "已归档" }
];

const filteredArticles = computed(() => {
  if (!activeStatus.value) return articles.value;
  return articles.value.filter((item) => item.status === activeStatus.value);
});
const publishedCount = computed(() => articles.value.filter((item) => item.status === "published").length);
const draftCount = computed(() => articles.value.filter((item) => item.status === "draft").length);
const totalViews = computed(() => articles.value.reduce((sum, item) => sum + Number(item.viewCount || 0), 0));
const emptyText = computed(() => {
  const label = tabs.find((item) => item.key === activeStatus.value)?.label || "资讯";
  return `暂无${label === "全部" ? "" : label}资讯记录`;
});

onShow(() => {
  loadArticles();
});

async function loadArticles() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorArticles();
    articles.value = Array.isArray(list) ? list : [];
  } catch (err) {
    error.value = err.message || "资讯记录读取失败";
    uni.showToast({ title: error.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectStatus(status) {
  activeStatus.value = status;
}

function statusText(status) {
  return {
    published: "已发布",
    draft: "草稿",
    archived: "已归档"
  }[status] || "状态待确认";
}

function statusClass(status) {
  if (status === "published") return "published";
  if (status === "draft") return "draft";
  return "archived";
}

function coverClass(status) {
  if (status === "published") return "blue";
  if (status === "draft") return "orange";
  return "green";
}

function formatDate(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function back() {
  safeBackCounselor("/pages/counselor/profile");
}
</script>

<style scoped>
.articles-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.add-btn {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  color: #fff;
  background: #4A90D9;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 58rpx;
}

.add-btn.disabled {
  opacity: .45;
}

.article-stack {
  display: grid;
  gap: 22rpx;
  padding: 24rpx 32rpx 40rpx;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.manage-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.manage-summary view {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 6rpx;
  padding: 22rpx 8rpx;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 4rpx 14rpx rgba(15,23,42,.04);
}

.summary-num {
  color: #4A90D9;
  font-size: 32rpx;
  font-weight: 900;
}

.summary-num.orange { color: #F97316; }
.summary-num.green { color: #16A34A; }

.summary-label {
  color: #94A3B8;
  font-size: 21rpx;
}

.line-tabs {
  display: flex;
  align-items: center;
  border-radius: 22rpx;
  background: #fff;
  overflow: hidden;
}

.line-tab {
  min-width: 0 !important;
  width: auto !important;
  height: 74rpx;
  flex: 1;
  border-radius: 0;
  color: #94A3B8;
  background: transparent;
  font-size: 23rpx;
  font-weight: 900;
}

.line-tab.active {
  color: #4A90D9;
  border-bottom: 4rpx solid #4A90D9;
}

.article-card {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37,99,235,.06);
}

.cover {
  width: 144rpx;
  height: 144rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 22rpx;
  color: #fff;
}

.cover .mini-icon {
  width: 58rpx;
  height: 58rpx;
}

.cover.blue {
  background: linear-gradient(135deg, #60A5FA, #4A90D9);
}

.cover.green {
  background: linear-gradient(135deg, #6EE7B7, #5EC4AC);
}

.cover.orange {
  background: linear-gradient(135deg, #FDBA74, #F97316);
}

.article-main {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 10rpx;
}

.article-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.article-title {
  min-width: 0;
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.status {
  flex: none;
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 900;
}

.status.published {
  color: #16A34A;
  background: #DCFCE7;
}

.status.draft {
  color: #EA580C;
  background: #FFEDD5;
}

.status.archived {
  color: #64748B;
  background: #F1F5F9;
}

.article-meta,
.article-summary {
  color: #94A3B8;
  font-size: 21rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.article-summary {
  color: #64748B;
  line-height: 1.5;
}

.article-actions {
  display: flex;
  gap: 10rpx;
}

.article-action {
  height: 54rpx;
  flex: 1;
  min-width: 0 !important;
  border-radius: 14rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 21rpx;
  font-weight: 900;
}

.article-action.danger {
  color: #EF4444;
  background: #FEF2F2;
}

.article-action.disabled {
  color: #94A3B8;
  background: #F1F5F9;
}

.notice-card {
  display: grid;
  gap: 8rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid #DBEAFE;
  border-radius: 22rpx;
  background: #F8FBFF;
}

.notice-title {
  color: #2563EB;
  font-size: 25rpx;
  font-weight: 900;
}

.notice-text,
.cp-empty-mini text {
  color: #64748B;
  font-size: 22rpx;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
