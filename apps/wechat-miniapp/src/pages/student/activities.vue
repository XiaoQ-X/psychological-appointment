<template>
  <view class="mobile-container stu-page">
    <status-bar />
    <page-header title="心理活动" show-back @back="goHome" />

    <view class="stu-tabs">
      <button v-for="item in categories" :key="item" :class="['stu-tab-chip', { active: activeCategory === item }]" @click="selectCategory(item)">
        {{ item }}
      </button>
    </view>

    <view class="stu-content">
      <scroll-view class="stu-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="stu-stack">
          <view v-if="loading" class="empty-state">
            <view class="empty-illustration"><view class="mini-icon calendar"></view></view>
            <text class="empty-title">活动加载中</text>
            <text class="empty-desc">请稍候</text>
          </view>

          <button v-for="activity in visibleActivities" v-else :key="activity.id" class="stu-card stu-activity-card" @click="go(`/pages/student/activity-detail?id=${activity.id}`)">
            <view :class="['stu-activity-cover', activity.tone]">
              <image class="stu-activity-cover-image" mode="aspectFill" :src="activity.cover" />
              <view class="stu-activity-cover-shade"></view>
              <text class="stu-cover-badge-left">{{ activity.category }}</text>
              <text class="stu-cover-badge-right">{{ activity.status }}</text>
            </view>
            <view class="stu-card-body">
              <text class="stu-title">{{ activity.title }}</text>
              <text class="stu-muted">{{ activity.time }}</text>
              <text class="stu-muted">{{ activity.location }}</text>
              <view class="stu-between">
                <text :class="['stu-tag', activity.full ? 'red' : 'orange']">{{ activity.seats }}</text>
                <text class="stu-chevron">›</text>
              </view>
            </view>
          </button>

          <view v-if="!loading && !visibleActivities.length" class="empty-state">
            <view class="empty-illustration"><view class="mini-icon calendar"></view></view>
            <text class="empty-title">暂无相关活动</text>
            <text class="empty-desc">请尝试其他分类</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <bottom-tabbar role="student" active="home" />
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getActivities } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const categories = ["全部", "团体活动", "讲座沙龙", "工作坊", "主题活动"];
const activeCategory = ref("全部");
const loading = ref(false);
const activities = ref([]);

onLoad(() => {
  loadActivities();
});

const visibleActivities = computed(() => {
  return activities.value;
});

function selectCategory(category) {
  activeCategory.value = category;
  loadActivities();
}

async function loadActivities() {
  loading.value = true;
  try {
    const list = await getActivities(activeCategory.value === "全部" ? {} : { category: activeCategory.value });
    activities.value = (Array.isArray(list) ? list : []).map(normalizeActivity);
  } catch (error) {
    activities.value = [];
    uni.showToast({ title: error.message || "活动列表加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeActivity(item = {}) {
  const capacity = Number(item.capacity || 0);
  const signupCount = Number(item.signupCount ?? item._count?.signups ?? item.signups?.length ?? 0);
  const remaining = Math.max(capacity - signupCount, 0);
  const full = capacity > 0 && remaining <= 0;
  return {
    id: item.id,
    title: item.title || "未命名活动",
    category: item.category || "心理活动",
    status: full ? "已报满" : activityStatusText(item.status),
    cover: resolveApiAssetUrl(item.cover) || BRAND_ASSETS.coverFallback,
    time: formatRange(item.startAt, item.endAt),
    location: item.location || "地点待确认",
    seats: capacity > 0 ? (full ? "已报满" : `剩余 ${remaining}/${capacity}人`) : "名额待确认",
    tone: toneByCategory(item.category),
    full
  };
}

function activityStatusText(status) {
  const map = {
    draft: "未发布",
    published: "进行中",
    ongoing: "进行中",
    full: "已报满",
    ended: "已结束",
    cancelled: "已取消"
  };
  return map[status] || "进行中";
}

function toneByCategory(category = "") {
  if (category.includes("讲座")) return "green";
  if (category.includes("工作坊")) return "purple";
  if (category.includes("主题")) return "orange";
  return "";
}

function formatRange(start, end) {
  const startDate = formatDateTime(start);
  const endDate = formatTime(end);
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  return startDate || "时间待确认";
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hour}:${minute}`;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}
</script>
