<template>
  <view class="mobile-container student-home-proto" :style="layoutStyle">
    <view class="proto-status">
      <text class="proto-status-time">09:41</text>
      <view class="proto-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="proto-home-header">
      <view class="proto-brand">
        <view class="proto-logo">
          <image class="proto-brand-mark" mode="aspectFill" :src="BRAND_ASSETS.logoSmall" />
        </view>
        <text class="proto-brand-title">拾光心理</text>
      </view>
      <view class="proto-header-actions">
        <button class="proto-icon-button" aria-label="搜索" @click="go('/pages/student/articles')">
          <view class="mini-icon search"></view>
        </button>
        <button class="proto-icon-button proto-bell-button" aria-label="消息" @click="go('/pages/student/messages')">
          <view class="mini-icon bell"></view>
          <view v-if="unreadCount > 0" class="proto-red-dot"></view>
        </button>
      </view>
    </view>

    <view class="proto-content">
      <scroll-view class="proto-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="proto-banner-section">
          <swiper
            v-if="recommendations.length"
            class="proto-banner-swiper"
            circular
            autoplay
            :interval="4200"
            :duration="380"
            :indicator-dots="recommendations.length > 1"
            indicator-color="rgba(255,255,255,.45)"
            indicator-active-color="#ffffff"
          >
            <swiper-item v-for="item in recommendations" :key="item.key">
              <button class="proto-banner" @click="go(item.targetUrl)">
                <image v-if="item.cover" class="proto-banner-image" mode="aspectFill" :src="item.cover" />
                <image v-else class="proto-banner-image" mode="aspectFill" :src="BRAND_ASSETS.homeBanner" />
                <view class="proto-banner-overlay">
                  <text class="proto-banner-kicker">{{ item.type === 'activity' ? '近期活动' : '热门资讯' }}</text>
                  <text class="proto-banner-title">{{ item.title }}</text>
                  <view class="proto-banner-tags">
                    <text>{{ item.subtitle }}</text>
                  </view>
                </view>
              </button>
            </swiper-item>
          </swiper>
          <view v-else class="proto-banner proto-banner-empty">
            <image class="proto-banner-image" mode="aspectFill" :src="BRAND_ASSETS.homeBanner" />
            <view class="proto-banner-overlay">
              <text class="proto-banner-kicker">{{ homeError ? '加载失败' : '暂无推荐' }}</text>
              <text class="proto-banner-title">{{ homeError || '心理科普和活动发布后会显示在这里' }}</text>
              <view class="proto-banner-tags">
                <text>{{ homeLoading ? '正在加载首页内容' : homeError ? '请稍后重试' : '请稍后查看' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="proto-category-grid">
          <button class="proto-category" @click="go('/pages/student/articles')">
            <view class="proto-category-icon blue">
              <image class="proto-category-image" mode="aspectFill" :src="BRAND_ASSETS.homeCategoryMentalHealth" />
            </view>
            <text>心理科普</text>
          </button>
          <button class="proto-category" @click="go('/pages/student/articles')">
            <view class="proto-category-icon orange">
              <image class="proto-category-image" mode="aspectFill" :src="BRAND_ASSETS.homeCategoryEmotion" />
            </view>
            <text>情绪调节</text>
          </button>
          <button class="proto-category" @click="go('/pages/student/articles')">
            <view class="proto-category-icon green">
              <image class="proto-category-image" mode="aspectFill" :src="BRAND_ASSETS.homeCategoryRelationship" />
            </view>
            <text>人际关系</text>
          </button>
          <button class="proto-category" @click="go('/pages/student/articles')">
            <view class="proto-category-icon purple">
              <image class="proto-category-image" mode="aspectFill" :src="BRAND_ASSETS.homeCategoryStudyPressure" />
            </view>
            <text>学业压力</text>
          </button>
        </view>

        <view class="proto-risk-section">
          <button class="proto-risk-card" @click="go('/pages/student/risk-assessment')">
            <view class="proto-risk-left">
              <view class="proto-risk-icon">
                <image class="proto-risk-image" mode="aspectFill" :src="BRAND_ASSETS.homeAssessmentCard" />
              </view>
              <view class="proto-risk-copy">
                <text class="proto-risk-title">心理健康自评</text>
                <text class="proto-risk-desc">3分钟快速了解你的心理状态</text>
              </view>
            </view>
            <text class="proto-chevron">›</text>
          </button>
        </view>

        <view class="proto-section">
          <view class="proto-section-head">
            <text class="proto-section-title">近期活动</text>
            <button class="proto-section-more" @click="go('/pages/student/activities')">查看更多</button>
          </view>
          <button class="proto-activity-card" @click="goFeaturedActivity">
            <image class="proto-activity-cover image" mode="aspectFill" :src="featuredActivity.cover" />
            <view class="proto-activity-body">
              <text class="proto-card-title">{{ featuredActivity.title }}</text>
              <text class="proto-card-meta">{{ featuredActivity.meta }}</text>
              <view class="proto-tag-row">
                <text class="proto-blue-tag">{{ featuredActivity.statusText }}</text>
                <text class="proto-orange-text">{{ featuredActivity.capacityText }}</text>
              </view>
            </view>
          </button>
        </view>

        <view class="proto-section proto-article-section">
          <view class="proto-section-head">
            <text class="proto-section-title">热门资讯</text>
            <button class="proto-section-more" @click="go('/pages/student/articles')">查看更多</button>
          </view>
          <button
            v-for="article in articles"
            :key="article.id || article.title"
            class="proto-article-card"
            @click="goArticle(article)"
          >
            <image class="proto-article-cover" mode="aspectFill" :src="article.cover" />
            <view class="proto-article-body">
              <text class="proto-article-title">{{ article.title }}</text>
              <view class="proto-article-footer">
                <text>{{ article.source }}</text>
                <view class="proto-eye-line">
                  <view class="mini-icon eye"></view>
                  <text>{{ article.views }}</text>
                </view>
              </view>
            </view>
          </button>
          <view v-if="!articles.length" class="proto-article-card">
            <view class="proto-activity-body">
              <text class="proto-article-title">暂无热门资讯</text>
              <view class="proto-article-footer">
                <text>发布后会显示在这里</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="proto-tabbar">
      <button class="proto-tab active">
        <view class="mini-icon home"></view>
        <text>首页</text>
      </button>
      <button class="proto-tab" @click="go('/pages/student/counselors')">
        <view class="mini-icon calendar"></view>
        <text>预约</text>
      </button>
      <button class="proto-tab" @click="go('/pages/student/articles')">
        <view class="mini-icon newspaper"></view>
        <text>资讯</text>
      </button>
      <button class="proto-tab" @click="go('/pages/student/profile')">
        <view class="mini-icon profile"></view>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getStudentHome } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const layoutStyle = getLayoutVars();

const emptyActivity = {
  title: "暂无近期活动",
  meta: "活动发布后会显示在这里",
  statusText: "暂无活动",
  capacityText: "",
  cover: BRAND_ASSETS.contentCoverFallback
};

const articles = ref([]);
const activities = ref([]);
const configuredCarousel = ref([]);
const homeLoading = ref(false);
const homeError = ref("");
const unreadCount = ref(0);

const featuredActivity = computed(() => activities.value[0] || emptyActivity);
const recommendations = computed(() => {
  if (configuredCarousel.value.length) return configuredCarousel.value;
  const activityItems = activities.value
    .filter((item) => item.id)
    .map((item) => ({
      key: `activity-${item.id}`,
      id: item.id,
      type: "activity",
      title: item.title,
      subtitle: item.meta,
      cover: item.cover,
      targetUrl: `/pages/student/activity-detail?id=${item.id}`
    }));
  const articleItems = articles.value
    .filter((item) => item.id)
    .map((item) => ({
      key: `article-${item.id}`,
      id: item.id,
      type: "article",
      title: item.title,
      subtitle: item.source,
      cover: item.cover,
      targetUrl: `/pages/student/article-detail?id=${item.id}`
    }));
  return [...activityItems, ...articleItems].slice(0, 5);
});

onLoad(() => {
  loadHome();
});

async function loadHome() {
  homeLoading.value = true;
  homeError.value = "";
  try {
    const data = await getStudentHome();
    articles.value = Array.isArray(data.articles) ? data.articles.map(normalizeArticle) : [];
    activities.value = Array.isArray(data.activities) ? data.activities.map(normalizeActivity) : [];
    configuredCarousel.value = Array.isArray(data.carousel) ? data.carousel.map(normalizeCarouselItem) : [];
    unreadCount.value = Array.isArray(data.notices) ? data.notices.filter((item) => !item.isRead).length : 0;
  } catch (error) {
    homeError.value = "首页内容暂时无法加载";
    articles.value = [];
    activities.value = [];
    configuredCarousel.value = [];
    unreadCount.value = 0;
    uni.showToast({ title: homeError.value, icon: "none" });
  } finally {
    homeLoading.value = false;
  }
}

function normalizeCarouselItem(item = {}) {
  const type = item.type === "activity" ? "activity" : "article";
  const id = item.id || item.targetId || "";
  return {
    key: item.key || `${type}-${id}`,
    id,
    type,
    title: item.title || "未命名推荐",
    subtitle: item.subtitle || "",
    cover: resolveContentCover(item.cover) || fallbackCoverForType(type, item),
    targetUrl: item.targetUrl || (type === "activity" ? `/pages/student/activity-detail?id=${id}` : `/pages/student/article-detail?id=${id}`)
  };
}

function normalizeArticle(item = {}) {
  return {
    id: item.id,
    title: item.title || "未命名资讯",
    source: item.authorRole === "counselor" ? "咨询师发布" : "心理中心",
    views: item.viewCount ? String(item.viewCount) : "0",
    cover: resolveContentCover(item.cover) || articleFallbackCover(item)
  };
}

function normalizeActivity(item = {}) {
  const signedCount = Array.isArray(item.signups) ? item.signups.filter((signup) => signup.status === "signed").length : 0;
  const capacity = Number(item.capacity || 0);
  return {
    id: item.id,
    title: item.title || "未命名活动",
    meta: `${formatDateTime(item.startAt)} · ${item.location || "心理中心"}`,
    statusText: item.status === "published" ? "进行中" : item.status || "待发布",
    capacityText: capacity ? `剩余 ${Math.max(capacity - signedCount, 0)}/${capacity}人` : "",
    cover: resolveContentCover(item.cover) || activityFallbackCover(item)
  };
}

function resolveContentCover(cover) {
  const text = String(cover || "").trim();
  if (text.startsWith("/static/")) return text;
  return resolveApiAssetUrl(text);
}

function fallbackCoverForType(type, item = {}) {
  return type === "activity" ? activityFallbackCover(item) : articleFallbackCover(item);
}

function activityFallbackCover(item = {}) {
  const text = `${item.title || ""} ${item.category || ""}`;
  if (text.includes("情绪") || text.includes("小组") || text.includes("团体")) {
    return BRAND_ASSETS.homeActivityEmotionGroupCover;
  }
  return BRAND_ASSETS.contentCoverFallback;
}

function articleFallbackCover(item = {}) {
  const text = `${item.title || ""} ${item.category || ""} ${item.summary || ""}`;
  if (text.includes("考试") || text.includes("焦虑") || text.includes("学习") || text.includes("学业") || text.includes("压力")) {
    return BRAND_ASSETS.homeArticleExamAnxietyCover;
  }
  return BRAND_ASSETS.contentCoverFallback;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function go(url) {
  goPage(url);
}

function goFeaturedActivity() {
  if (featuredActivity.value?.id) {
    go(`/pages/student/activity-detail?id=${featuredActivity.value.id}`);
    return;
  }
  go("/pages/student/activities");
}

function goArticle(article) {
  const suffix = article?.id ? `?id=${article.id}` : "";
  go(`/pages/student/article-detail${suffix}`);
}
</script>

<style scoped>
.student-home-proto {
  background: #f8fafc;
}

.proto-status {
  height: 80rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 48rpx 0;
  color: #111827;
  font-size: 24rpx;
  font-weight: 700;
}

.proto-status-icons {
  width: 104rpx;
  display: flex;
  justify-content: flex-end;
  gap: 10rpx;
  color: #111827;
}

.proto-status-icons .mini-icon {
  width: 22rpx;
  height: 22rpx;
}

.proto-home-header {
  min-height: 112rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
}

.proto-brand,
.proto-header-actions {
  display: flex;
  align-items: center;
}

.proto-brand {
  gap: 16rpx;
}

.proto-logo {
  width: 64rpx;
  height: 64rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #fff;
  background: #EEF6FF;
  overflow: hidden;
}

.proto-brand-mark {
  width: 100%;
  height: 100%;
}

.proto-brand-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 800;
}

.proto-header-actions {
  gap: 24rpx;
}

.proto-icon-button {
  width: 56rpx;
  height: 56rpx;
  position: relative;
  display: grid;
  place-items: center;
  color: #6b7280;
  background: transparent;
}

.proto-icon-button .mini-icon {
  width: 44rpx;
  height: 44rpx;
}

.proto-red-dot {
  position: absolute;
  top: 2rpx;
  right: 2rpx;
  width: 16rpx;
  height: 16rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  background: #ef4444;
}

.proto-content {
  flex: 1;
  min-height: 0;
}

.proto-scroll {
  height: 100%;
  overflow-x: hidden;
}

.proto-banner-section {
  padding: 32rpx 40rpx;
}

.proto-banner-swiper {
  height: 320rpx;
  border-radius: 32rpx;
  overflow: hidden;
}

.proto-banner {
  width: 100%;
  height: 320rpx;
  position: relative;
  overflow: hidden;
  display: block;
  padding: 0;
  margin: 0;
  border-radius: 32rpx;
  background: #4A90D9;
  box-shadow: 0 20rpx 34rpx rgba(15, 23, 42, .12);
  line-height: 1;
  text-align: left;
}

.proto-banner::after {
  border: none;
}

.proto-banner-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.proto-banner-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,.36);
  background: linear-gradient(135deg, #4A90D9, #5cb8b2);
}

.proto-banner-fallback .mini-icon {
  width: 116rpx;
  height: 116rpx;
}

.proto-banner-empty {
  box-shadow: none;
}

.proto-banner-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10rpx;
  padding: 32rpx;
  background: linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.56));
}

.proto-banner-kicker {
  color: rgba(255,255,255,.82);
  font-size: 24rpx;
  font-weight: 600;
}

.proto-banner-title {
  max-width: 100%;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: #fff;
  font-size: 36rpx;
  line-height: 1.28;
  font-weight: 800;
  text-shadow: 0 2rpx 8rpx rgba(0,0,0,.2);
}

.proto-banner-tags {
  display: flex;
  gap: 16rpx;
  margin-top: 8rpx;
}

.proto-banner-tags text {
  min-height: 32rpx;
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  color: #fff;
  background: rgba(255,255,255,.3);
  font-size: 20rpx;
  line-height: 1.1;
}

.proto-category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32rpx;
  padding: 0 40rpx 48rpx;
}

.proto-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  color: #4b5563;
  font-size: 24rpx;
  background: transparent;
}

.proto-category text {
  min-width: 128rpx;
  text-align: center;
  white-space: nowrap;
}

.proto-category-icon {
  width: 96rpx;
  height: 96rpx;
  display: grid;
  place-items: center;
  border-radius: 32rpx;
  overflow: hidden;
  background: #fff;
}

.proto-category-icon .mini-icon {
  width: 46rpx;
  height: 46rpx;
}

.proto-category-image {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: inherit;
}

.proto-category-icon.blue {
  color: #3b82f6;
  background: #eff6ff;
}

.proto-category-icon.orange {
  color: #f97316;
  background: #fff7ed;
}

.proto-category-icon.green {
  color: #22c55e;
  background: #f0fdf4;
}

.proto-category-icon.purple {
  color: #8b5cf6;
  background: #f5f3ff;
}

.proto-risk-section,
.proto-section {
  padding: 0 40rpx 48rpx;
}

.proto-risk-card {
  width: 100%;
  min-height: 144rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border: 1rpx solid #fed7aa;
  border-radius: 32rpx;
  background: #fff7ed;
}

.proto-risk-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.proto-risk-icon {
  width: 96rpx;
  height: 96rpx;
  display: grid;
  place-items: center;
  border-radius: 24rpx;
  color: #ea580c;
  background: #fff;
  overflow: hidden;
}

.proto-risk-image {
  width: 100%;
  height: 100%;
  display: block;
}

.proto-risk-title {
  display: block;
  color: #7c2d12;
  font-size: 28rpx;
  font-weight: 800;
}

.proto-risk-desc {
  display: block;
  margin-top: 4rpx;
  color: #c2410c;
  font-size: 20rpx;
}

.proto-chevron {
  color: #fb923c;
  font-size: 44rpx;
  line-height: 1;
}

.proto-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.proto-section-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 800;
}

.proto-section-more {
  min-height: 44rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 24rpx;
  background: transparent;
  line-height: 1.2;
}

.proto-activity-card,
.proto-article-card {
  width: 100%;
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.05);
  text-align: left;
}

.proto-activity-cover {
  width: 192rpx;
  height: 160rpx;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 24rpx;
  color: rgba(255,255,255,.75);
  background: linear-gradient(135deg, #60a5fa, #818cf8);
}

.proto-activity-cover.image {
  display: block;
  background: #e5e7eb;
}

.proto-activity-cover .mini-icon {
  width: 52rpx;
  height: 52rpx;
}

.proto-activity-body,
.proto-article-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.proto-card-title,
.proto-article-title {
  color: #1f2937;
  font-size: 28rpx;
  line-height: 1.35;
  font-weight: 800;
}

.proto-card-meta {
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-tag-row,
.proto-article-footer,
.proto-eye-line {
  display: flex;
  align-items: center;
}

.proto-tag-row {
  gap: 16rpx;
}

.proto-blue-tag {
  min-height: 32rpx;
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  color: #3b82f6;
  background: #eff6ff;
  font-size: 18rpx;
  line-height: 1.1;
}

.proto-orange-text {
  color: #f97316;
  font-size: 20rpx;
}

.proto-article-section {
  padding-bottom: 178rpx;
}

.proto-article-card {
  min-height: 160rpx;
  margin-bottom: 32rpx;
}

.proto-article-cover {
  width: 192rpx;
  height: 160rpx;
  flex: none;
  border-radius: 24rpx;
  display: block;
  background: #eef6ff;
}

.proto-article-cover-fallback {
  display: grid;
  place-items: center;
  color: rgba(59,130,246,.7);
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.proto-article-cover-fallback .mini-icon {
  width: 52rpx;
  height: 52rpx;
}

.proto-article-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.proto-article-footer {
  justify-content: space-between;
  color: #9ca3af;
  font-size: 20rpx;
}

.proto-eye-line {
  gap: 6rpx;
}

.proto-eye-line .mini-icon {
  width: 24rpx;
  height: 24rpx;
}

.proto-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 32rpx 8rpx;
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.proto-tab {
  min-width: 112rpx;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 600;
  background: transparent;
  line-height: 1.15;
}

.proto-tab.active {
  color: #4A90D9;
}

.proto-tab .mini-icon {
  width: 44rpx;
  height: 44rpx;
}
</style>
