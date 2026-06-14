<template>
  <view class="mobile-container activity-page" :style="layoutStyle">
    <status-bar />
    <page-header title="活动详情" show-back @back="goBack" />

    <scroll-view class="activity-content" scroll-y enhanced :show-scrollbar="false">
      <view class="activity-cover">
        <image class="activity-cover-image" mode="aspectFill" :src="activity.cover" />
        <text class="activity-badge">{{ activity.category }}</text>
      </view>

      <view class="activity-main-card">
        <text class="activity-title">{{ activity.title }}</text>
        <view class="activity-info-list">
          <view class="activity-info-row">
            <view class="activity-icon blue"><view class="mini-icon calendar"></view></view>
            <view>
              <text class="activity-info-label">活动时间</text>
              <text class="activity-info-value">{{ activity.time }}</text>
            </view>
          </view>
          <view class="activity-info-row">
            <view class="activity-icon green"><view class="mini-icon school"></view></view>
            <view>
              <text class="activity-info-label">活动地点</text>
              <text class="activity-info-value">{{ activity.location }}</text>
            </view>
          </view>
          <view class="activity-info-row">
            <view class="activity-icon purple"><view class="mini-icon profile"></view></view>
            <view>
              <text class="activity-info-label">主办方</text>
              <text class="activity-info-value">{{ activity.host }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="loading || errorText" class="activity-card">
        <text class="activity-section-title">{{ loading ? "活动加载中" : "无法打开活动" }}</text>
        <text class="activity-paragraph">{{ loading ? "请稍候" : errorText }}</text>
        <button v-if="errorText" class="error-return-btn" @click="goBackToList">返回活动列表</button>
      </view>

      <view v-else class="activity-card">
        <text class="activity-section-title">活动介绍</text>
        <text v-for="paragraph in activityParagraphs" :key="paragraph" class="activity-paragraph">{{ paragraph }}</text>
      </view>

      <view v-if="!loading && !errorText" class="activity-card">
        <text class="activity-section-title">适合人群</text>
        <view v-if="activity.suitableFor.length" class="activity-tag-row">
          <text v-for="tag in activity.suitableFor" :key="tag" class="activity-tag">{{ tag }}</text>
        </view>
        <text v-else class="activity-paragraph">暂无适合人群说明</text>
      </view>

      <view v-if="!loading && !errorText" class="activity-card lecturer-card">
        <text class="activity-section-title">带领者</text>
        <view class="lecturer-row">
          <image class="lecturer-avatar" mode="aspectFill" :src="activity.leaderAvatar" />
          <view>
            <text class="lecturer-name">{{ activity.leaderName }}</text>
            <text class="lecturer-title">{{ activity.leaderTitle }}</text>
          </view>
        </view>
      </view>

      <view class="activity-bottom-space"></view>
    </scroll-view>

    <view class="activity-footer">
      <button class="activity-submit" :disabled="loading || Boolean(errorText) || activity.isFull || activity.isSignedUp" @click="goSignup">
        {{ activity.isSignedUp ? "已报名" : activity.isFull ? "名额已满" : "立即报名" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getActivityDetail } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, safeBackStudent } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const layoutStyle = getLayoutVars();

const activityId = ref("");
const loading = ref(false);
const errorText = ref("");
const activity = ref(defaultActivity());

const activityParagraphs = computed(() => {
  const content = activity.value.description || activity.value.introduction || "暂无活动介绍";
  return String(content).split(/\n+/).map((item) => item.trim()).filter(Boolean);
});

onLoad((query = {}) => {
  activityId.value = query.id || "";
  loadActivity();
});

async function loadActivity() {
  if (!activityId.value) {
    errorText.value = "缺少活动 ID";
    uni.showToast({ title: errorText.value, icon: "none" });
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getActivityDetail(activityId.value);
    activity.value = normalizeActivity(detail);
  } catch (error) {
    errorText.value = error.message || "活动详情加载失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function defaultActivity() {
  return {
    id: "",
    title: "活动加载中",
    category: "心理活动",
    time: "时间待确认",
    location: "地点待确认",
    host: "主办方待确认",
    description: "",
    introduction: "",
    cover: BRAND_ASSETS.coverFallback,
    suitableFor: [],
    leaderName: "带领者待确认",
    leaderTitle: "活动信息待确认",
    leaderAvatar: BRAND_ASSETS.defaultCounselorAvatar,
    isFull: false,
    isSignedUp: false
  };
}

function normalizeActivity(item = {}) {
  const capacity = Number(item.capacity || 0);
  const signupCount = Number(item.signupCount ?? item.signups?.length ?? 0);
  const suitableFor = Array.isArray(item.suitableFor)
    ? item.suitableFor
    : String(item.suitableFor || "").split(/[、,，\n]/).map((tag) => tag.trim()).filter(Boolean);
  return {
    ...defaultActivity(),
    id: item.id || activityId.value,
    title: item.title || "未命名活动",
    category: item.category || "心理活动",
    cover: resolveApiAssetUrl(item.cover) || BRAND_ASSETS.coverFallback,
    time: formatRange(item.startAt, item.endAt),
    location: item.location || "地点待确认",
    host: item.organizer || "心理中心",
    description: item.description || item.summary || "",
    introduction: item.introduction || "",
    suitableFor,
    leaderName: item.leader || item.leaderName || "带领者待确认",
    leaderTitle: item.leaderTitle || item.organizer || "活动信息待确认",
    leaderAvatar: resolveApiAssetUrl(item.leaderAvatar) || BRAND_ASSETS.defaultCounselorAvatar,
    isFull: capacity > 0 && signupCount >= capacity,
    isSignedUp: Boolean(item.isSignedUp || item.mySignup)
  };
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

function goSignup() {
  if (!activityId.value || loading.value || errorText.value || activity.value.isFull || activity.value.isSignedUp) return;
  goPage(`/pages/student/activity-signup?id=${activityId.value}`);
}

function goBack() {
  safeBackStudent("/pages/student/activities");
}

function goBackToList() {
  goPage("/pages/student/activities");
}
</script>

<style scoped>
.activity-page {
  background: #f8fafc;
}

.activity-content {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.activity-cover {
  height: 352rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #60a5fa, #6366f1);
  overflow: hidden;
}

.activity-cover .mini-icon {
  width: 120rpx;
  height: 120rpx;
  color: rgba(255,255,255,.46);
}

.activity-cover-image {
  width: 100%;
  height: 100%;
  display: block;
}

.activity-badge {
  position: absolute;
  left: 24rpx;
  top: 24rpx;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  color: #fff;
  background: rgba(255,255,255,.28);
  font-size: 20rpx;
  font-weight: 700;
}

.activity-main-card {
  margin: -48rpx 40rpx 32rpx;
  padding: 40rpx;
  position: relative;
  z-index: 2;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.activity-title {
  display: block;
  color: #1f2937;
  font-size: 34rpx;
  line-height: 1.35;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.activity-info-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 32rpx;
}

.activity-info-row {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.activity-icon {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.activity-icon .mini-icon {
  width: 38rpx;
  height: 38rpx;
}

.activity-icon.blue { color: #3b82f6; background: #eff6ff; }
.activity-icon.green { color: #22c55e; background: #f0fdf4; }
.activity-icon.purple { color: #8b5cf6; background: #f5f3ff; }

.activity-info-label,
.activity-info-value {
  display: block;
}

.activity-info-label {
  color: #374151;
  font-size: 24rpx;
  font-weight: 700;
}

.activity-info-value {
  margin-top: 4rpx;
  color: #9ca3af;
  font-size: 22rpx;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.activity-card {
  margin: 0 40rpx 32rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.activity-section-title {
  display: block;
  margin-bottom: 24rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.activity-paragraph {
  display: block;
  margin-top: 16rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.activity-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.activity-tag {
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #eff6ff;
  font-size: 20rpx;
  font-weight: 700;
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.lecturer-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.lecturer-avatar {
  width: 96rpx;
  height: 96rpx;
  flex: none;
  border-radius: 24rpx;
  background: #EBF3FC;
}

.lecturer-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4A90D9;
  font-size: 28rpx;
  font-weight: 900;
}

.lecturer-name {
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.lecturer-title {
  display: block;
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 20rpx;
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.activity-bottom-space {
  height: calc(156rpx + env(safe-area-inset-bottom));
}

.activity-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.activity-submit {
  width: 100%;
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .18);
}

.error-return-btn {
  width: 100%;
  min-height: 80rpx;
  margin-top: 24rpx;
  border-radius: 24rpx;
  color: #4A90D9;
  background: #eff6ff;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
