<template>
  <view class="mobile-container stu-page">
    <status-bar />
    <page-header title="心理科普" show-back @back="goHome" />

    <view class="stu-tabs">
      <button v-for="item in categories" :key="item" :class="['stu-tab-chip', { active: activeCategory === item }]" @click="selectCategory(item)">
        {{ item }}
      </button>
    </view>

    <view class="stu-content">
      <scroll-view class="stu-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="stu-stack">
          <view v-if="loading" class="empty-state">
            <view class="empty-illustration"><view class="mini-icon book"></view></view>
            <text class="empty-title">内容加载中</text>
            <text class="empty-desc">请稍候</text>
          </view>

          <block v-else>
            <button v-for="article in visibleArticles" :key="article.id" class="stu-card stu-article-card" @click="go(`/pages/student/article-detail?id=${article.id}`)">
              <image class="stu-article-cover" mode="aspectFill" :src="article.cover" />
              <view class="stu-card-body">
                <text class="stu-title">{{ article.title }}</text>
                <text class="stu-subtitle">{{ article.summary }}</text>
                <view class="stu-meta-line">
                  <text>{{ article.author }}</text>
                  <text>{{ article.reads }} 阅读</text>
                </view>
              </view>
            </button>
          </block>

          <view v-if="!loading && !visibleArticles.length" class="empty-state">
            <view class="empty-illustration"><view class="mini-icon book"></view></view>
            <text class="empty-title">暂无相关内容</text>
            <text class="empty-desc">请尝试其他分类</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <bottom-tabbar role="student" active="articles" />
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getArticles } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage } from "@/utils/navigation";

// UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。
const categories = ["全部", "情绪调节", "人际关系", "学习压力", "睡眠健康"];
const activeCategory = ref("全部");
const loading = ref(false);
const articles = ref([]);

onLoad(() => {
  loadArticles();
});

const visibleArticles = computed(() => {
  if (activeCategory.value === "全部") return articles.value;
  return articles.value.filter((item) => item.category === activeCategory.value);
});

function selectCategory(category) {
  activeCategory.value = category;
  loadArticles();
}

async function loadArticles() {
  loading.value = true;
  try {
    const list = await getArticles(activeCategory.value === "全部" ? {} : { category: activeCategory.value });
    articles.value = (Array.isArray(list) ? list : []).map(normalizeArticle);
  } catch (error) {
    articles.value = [];
    uni.showToast({ title: error.message || "文章列表加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeArticle(item = {}) {
  return {
    id: item.id,
    title: item.title || "未命名文章",
    category: item.category || "心理科普",
    summary: item.summary || "",
    author: displayAuthor(item),
    reads: Number(item.viewCount || 0),
    cover: resolveApiAssetUrl(item.cover) || BRAND_ASSETS.coverFallback,
    tone: ""
  };
}

function displayAuthor(item = {}) {
  if (item.author?.name) return item.author.name;
  if (item.authorRole === "counselor") return "心理中心咨询师";
  if (item.authorRole === "admin") return "心理中心";
  return "心理中心";
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}
</script>
