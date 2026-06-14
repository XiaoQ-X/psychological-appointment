<template>
  <view class="mobile-container article-page">
    <status-bar />
    <page-header title="心理资讯" show-back @back="goBack" />

    <scroll-view class="article-content" scroll-y enhanced :show-scrollbar="false">
      <view class="article-inner">
        <view v-if="loading" class="article-richtext">
          <text class="article-paragraph">文章加载中...</text>
        </view>
        <view v-else-if="errorText" class="article-richtext">
          <text class="article-section-title">无法打开文章</text>
          <text class="article-paragraph">{{ errorText }}</text>
          <button class="error-return-btn" @click="go('/pages/student/articles')">返回文章列表</button>
        </view>
        <block v-else>
        <text class="article-title">{{ article.title }}</text>
        <view class="author-row">
          <image class="author-avatar" mode="aspectFill" :src="article.authorAvatar" />
          <view class="author-copy">
            <text class="author-name">{{ article.authorName }}</text>
            <text class="article-meta">发布于 {{ article.createdAt }} · {{ article.viewCount }} 阅读</text>
          </view>
        </view>

        <image class="article-cover" mode="aspectFill" :src="article.cover" />

        <view class="article-richtext">
          <text v-for="paragraph in articleParagraphs" :key="paragraph" class="article-paragraph">{{ paragraph }}</text>
        </view>
        </block>
      </view>
    </scroll-view>

    <view class="article-footer">
      <view class="article-actions">
        <view class="article-action static"><view class="mini-icon heart"></view><text>{{ article.viewCount }}</text></view>
        <button class="article-action disabled" disabled><view class="mini-icon star"></view><text>收藏</text></button>
        <button class="article-action" open-type="share"><view class="mini-icon more"></view><text>分享</text></button>
      </view>
      <button class="consult-btn" @click="go('/pages/student/counselors')">咨询老师</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShareAppMessage } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getArticleDetail } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, safeBackStudent } from "@/utils/navigation";

const loading = ref(false);
const errorText = ref("");
const article = ref({
  title: "",
  cover: "",
  summary: "",
  content: "",
  authorName: "心理中心",
  authorAvatar: "",
  createdAt: "",
  viewCount: 0
});

const articleParagraphs = computed(() => {
  const content = article.value.content || article.value.summary || "暂无正文内容";
  return String(content).split(/\n+/).map((item) => item.trim()).filter(Boolean);
});

onLoad((query = {}) => {
  loadArticle(query.id);
});

onShareAppMessage(() => ({
  title: article.value.title || "心理资讯",
  path: "/pages/student/articles"
}));

async function loadArticle(id) {
  if (!id) {
    errorText.value = "缺少文章 ID";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getArticleDetail(id);
    article.value = normalizeArticle(detail);
  } catch (error) {
    errorText.value = error.message || "文章详情加载失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeArticle(item = {}) {
  return {
    title: item.title || "未命名文章",
    cover: resolveApiAssetUrl(item.cover) || BRAND_ASSETS.coverFallback,
    summary: item.summary || "",
    content: item.content || "",
    authorName: displayAuthor(item),
    authorAvatar: resolveApiAssetUrl(item.author?.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
    createdAt: formatDate(item.createdAt),
    viewCount: Number(item.viewCount || 0)
  };
}

function displayAuthor(item = {}) {
  if (item.author?.name) return item.author.name;
  if (item.authorRole === "counselor") return "心理中心咨询师";
  if (item.authorRole === "admin") return "心理中心";
  return "心理中心";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function go(url) {
  goPage(url);
}

function goBack() {
  safeBackStudent("/pages/student/articles");
}
</script>

<style scoped>
.article-page {
  background: #fff;
}

.article-content {
  flex: 1;
  min-height: 0;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.article-inner {
  padding: 40rpx;
}

.article-title {
  display: block;
  margin-bottom: 32rpx;
  color: #1f2937;
  font-size: 40rpx;
  line-height: 1.25;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.author-avatar {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  border-radius: 999rpx;
  background: #EBF3FC;
}

.author-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4A90D9;
  font-size: 24rpx;
  font-weight: 900;
}

.author-copy {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.author-name {
  color: #374151;
  font-size: 24rpx;
  font-weight: 800;
}

.article-meta {
  color: #9ca3af;
  font-size: 20rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.article-cover {
  width: 100%;
  height: 384rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48rpx;
  border-radius: 32rpx;
  background: #e5e7eb;
  overflow: hidden;
}

.article-cover-placeholder {
  flex-direction: column;
  gap: 14rpx;
  color: #4A90D9;
  background: linear-gradient(135deg, #EBF3FC 0%, #F6FBFF 100%);
  font-size: 24rpx;
  font-weight: 900;
}

.article-cover-placeholder .mini-icon {
  width: 64rpx;
  height: 64rpx;
}

.article-richtext {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.article-paragraph {
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.article-section-title {
  margin-top: 8rpx;
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
}

.article-quote {
  padding: 32rpx;
  border-left: 8rpx solid #60a5fa;
  border-radius: 24rpx;
  background: #eff6ff;
}

.article-quote text {
  color: #4b5563;
  font-size: 24rpx;
  line-height: 1.7;
  font-style: italic;
}

.article-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 48rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.article-actions {
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.article-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.article-action.static {
  pointer-events: none;
}

.article-action.disabled {
  opacity: .46;
}

.article-action .mini-icon {
  width: 40rpx;
  height: 40rpx;
}

.consult-btn {
  min-width: 184rpx;
  max-width: 240rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 24rpx;
  font-weight: 800;
  box-shadow: 0 8rpx 18rpx rgba(74, 144, 217, .16);
}

.error-return-btn {
  width: 100%;
  min-height: 80rpx;
  border-radius: 24rpx;
  color: #4A90D9;
  background: #eff6ff;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
