<template>
  <view class="mobile-container sp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>

    <view class="sp-header">
      <button class="sp-back" @click="goHome"><view class="mini-icon chevron-left"></view></button>
      <text class="sp-header-title">预约咨询</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="booking-tabs">
      <button v-for="item in filters" :key="item" :class="['booking-tab', { active: item === activeFilter }]" @click="selectFilter(item)">{{ item }}</button>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="booking-list-stack">
          <view class="search-block">
            <view class="search-box">
              <view class="mini-icon search"></view>
              <input class="search-input" v-model="keyword" placeholder="搜索咨询师姓名或擅长领域" @confirm="loadCounselors" />
            </view>
          </view>

          <view v-for="item in counselors" :key="item.id || item.name" class="student-counselor-card">
            <view class="sp-counselor-main">
              <image class="counselor-photo" mode="aspectFill" :src="item.avatar" />
              <view class="sp-card-main">
                <view class="card-topline">
                  <view>
                    <text class="counselor-name">{{ item.name }}</text>
                    <text class="counselor-title">{{ item.title }}</text>
                  </view>
                  <text class="sp-rating">★ {{ item.rating }}</text>
                </view>
                <view class="sp-tags">
                  <text v-for="tag in item.tags" :key="tag" class="sp-tag">{{ tag }}</text>
                </view>
              </view>
            </view>
            <view class="counselor-card-footer">
              <view class="available-line"><view class="mini-icon clock"></view><text>最近可约：{{ item.next }}</text></view>
              <view class="sp-small-actions">
                <button class="sp-small-btn ghost" @click="goDetail(item)">查看详情</button>
                <button class="sp-small-btn primary" :disabled="!item.scheduleId" @click="goBooking(item)">{{ item.scheduleId ? "立即预约" : "暂无可约" }}</button>
              </view>
            </view>
          </view>
          <view v-if="loading" class="student-counselor-card">
            <text class="counselor-name">正在加载咨询师...</text>
          </view>
          <view v-else-if="!counselors.length" class="student-counselor-card">
            <text class="counselor-name">暂无可预约咨询师</text>
            <text class="counselor-title">心理中心配置咨询师和排班后会显示在这里</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="sp-tabbar">
      <button class="sp-tab" @click="goHome"><view class="mini-icon home"></view><text>首页</text></button>
      <button class="sp-tab active"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab" @click="go('/pages/student/articles')"><view class="mini-icon newspaper"></view><text>资讯</text></button>
      <button class="sp-tab" @click="go('/pages/student/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselors } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const filters = ["全部", "情绪压力", "人际交往", "学业规划", "自我成长"];
const counselors = ref([]);
const activeFilter = ref("全部");
const keyword = ref("");
const loading = ref(false);

onLoad(() => {
  loadCounselors();
});

async function loadCounselors() {
  loading.value = true;
  try {
    const queryKeyword = keyword.value.trim() || (activeFilter.value === "全部" ? "" : activeFilter.value);
    const data = await getCounselors({ keyword: queryKeyword });
    counselors.value = Array.isArray(data) ? data.map(normalizeCounselor) : [];
  } catch (error) {
    counselors.value = [];
    uni.showToast({ title: error.message || "咨询师加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function normalizeCounselor(item) {
  const schedules = Array.isArray(item.schedules) ? item.schedules : [];
  const firstSchedule = schedules[0];
  return {
    id: item.id,
    name: item.name || "未命名咨询师",
    title: item.title || "心理咨询师",
    rating: "暂无",
    tags: Array.isArray(item.specialties) ? item.specialties : [],
    next: firstSchedule ? formatSchedule(firstSchedule) : "暂无可约时段",
    scheduleId: firstSchedule?.id || "",
    avatar: resolveApiAssetUrl(item.avatar) || BRAND_ASSETS.defaultCounselorAvatar,
    initial: String(item.name || "咨").slice(0, 1)
  };
}

function formatSchedule(schedule) {
  const start = new Date(schedule.startAt);
  if (Number.isNaN(start.getTime())) return "可预约";
  return start.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function selectFilter(item) {
  activeFilter.value = item;
  loadCounselors();
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}

function goDetail(item) {
  if (!item.id) return;
  go(`/pages/student/counselor-detail?id=${item.id}`);
}

function goBooking(item) {
  if (!item.id) return;
  if (!item.scheduleId) {
    uni.showToast({ title: "该咨询师暂无可约时段", icon: "none" });
    return;
  }
  const schedulePart = item.scheduleId ? `&scheduleId=${item.scheduleId}` : "";
  go(`/pages/student/booking-form?counselorId=${item.id}${schedulePart}`);
}
</script>

<style scoped>
.booking-tabs {
  height: 90rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 0 40rpx;
  background: #fff;
  border-bottom: 1rpx solid #f3f4f6;
  overflow: hidden;
}

.booking-tab {
  position: relative;
  flex: none;
  height: 88rpx;
  color: #9ca3af;
  font-size: 26rpx;
  font-weight: 700;
}

.booking-tab.active {
  color: #4A90D9;
}

.booking-tab.active::after {
  content: "";
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: #4A90D9;
}

.booking-list-stack {
  display: grid;
  gap: 24rpx;
  padding: 28rpx 40rpx 148rpx;
}

.search-block {
  padding: 0 0 4rpx;
}

.search-box {
  height: 76rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 0 28rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15,23,42,.04);
}

.search-box .mini-icon {
  width: 32rpx;
  height: 32rpx;
  color: #9ca3af;
}

.search-input {
  flex: 1;
  height: 72rpx;
  color: #1f2937;
  font-size: 26rpx;
}

.student-counselor-card {
  display: grid;
  gap: 28rpx;
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 10rpx rgba(15,23,42,.05);
}

.sp-counselor-main {
  display: flex;
  gap: 28rpx;
  align-items: flex-start;
}

.counselor-photo {
  width: 160rpx;
  height: 160rpx;
  flex: none;
  border-radius: 24rpx;
  background: #EBF3FC;
}

.fallback-avatar {
  display: grid;
  place-items: center;
  color: #4A90D9;
  font-size: 48rpx;
  font-weight: 900;
}

.sp-card-main {
  flex: 1;
  min-width: 0;
}

.card-topline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.counselor-name {
  display: block;
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 900;
}

.counselor-title {
  display: block;
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 22rpx;
  line-height: 1.4;
}

.counselor-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f3f4f6;
}

.available-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.available-line .mini-icon {
  width: 24rpx;
  height: 24rpx;
  flex: none;
}
</style>
