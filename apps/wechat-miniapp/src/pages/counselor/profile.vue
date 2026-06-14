<template>
  <view class="mobile-container sp-page counselor-profile-page" :style="layoutStyle">
    <view class="sp-status profile-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="profile-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="profile-stack">
          <view class="profile-hero">
            <button class="edit-btn" @click="go('/pages/counselor/profile-edit')">编辑</button>
            <image class="hero-avatar hero-avatar-image" mode="aspectFill" :src="profileAvatar" />
            <text class="hero-name">{{ profileName }}</text>
            <text class="hero-desc">{{ profileDesc }}</text>
            <text class="online-badge">{{ statusText }}</text>
          </view>

          <view class="stats-card">
            <view>
              <text class="stat-num">{{ statText(profileStats.students) }}</text>
              <text class="stat-label">服务学生</text>
            </view>
            <view>
              <text class="stat-num">{{ statText(profileStats.completed) }}</text>
              <text class="stat-label">完成咨询</text>
            </view>
            <view>
              <text class="stat-num">{{ statText(profileStats.risks) }}</text>
              <text class="stat-label">待处理风险</text>
            </view>
          </view>

          <view class="proto-card specialty-card">
            <view class="section-head">
              <text class="section-title">擅长领域</text>
              <button @click="go('/pages/counselor/profile-edit')">管理</button>
            </view>
            <view class="tag-list">
              <text v-for="item in specialties" :key="item">{{ item }}</text>
              <text v-if="!specialties.length">待完善</text>
            </view>
          </view>

          <view v-if="error" class="proto-card specialty-card">
            <text class="section-title">资料读取失败</text>
            <text class="menu-desc">{{ error }}</text>
          </view>

          <view class="proto-card menu-card">
            <button class="menu-item" @click="go('/pages/counselor/schedule')">
              <view class="menu-icon blue"><view class="mini-icon calendar"></view></view>
              <view>
                <text class="menu-title">排班设置</text>
                <text class="menu-desc">维护可预约时间</text>
              </view>
              <text class="chevron">›</text>
            </button>
            <button class="menu-item" @click="go('/pages/counselor/shift-apply')">
              <view class="menu-icon orange"><view class="mini-icon clock"></view></view>
              <view>
                <text class="menu-title">调班申请</text>
                <text class="menu-desc">提交排班变更申请</text>
              </view>
              <text class="chevron">›</text>
            </button>
            <button class="menu-item" @click="go('/pages/counselor/articles')">
                <view class="menu-icon green"><view class="mini-icon newspaper"></view></view>
                <view>
                  <text class="menu-title">资讯管理</text>
                  <text class="menu-desc">查看与维护本人发布内容</text>
                </view>
                <text class="chevron">›</text>
            </button>
            <button class="menu-item" @click="go('/pages/counselor/messages')">
              <view class="menu-icon pink"><view class="mini-icon bell"></view></view>
              <view>
                <text class="menu-title">消息中心</text>
                <text class="menu-desc">查看预约与转介提醒</text>
              </view>
              <text class="chevron">›</text>
            </button>
          </view>

          <button class="logout-btn" @click="logout">退出登录</button>
        </view>
      </scroll-view>
    </view>

    <view class="sp-tabbar cp-tabbar">
      <button class="sp-tab" @click="go('/pages/counselor/dashboard')">
        <view class="mini-icon dashboard"></view>
        <text>工作台</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/appointments')">
        <view class="mini-icon calendar"></view>
        <text>预约</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/students')">
        <view class="mini-icon students"></view>
        <text>学生</text>
      </button>
      <button class="sp-tab active" @click="go('/pages/counselor/profile')">
        <view class="mini-icon profile"></view>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { clearSession, resolveApiAssetUrl } from "../../api/client";
import { getCounselorAppointments, getCounselorProfile, getCounselorRiskRecords, getCounselorStudents } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const loading = ref(false);
const error = ref("");
const profile = ref(null);
const profileStats = ref({ students: null, completed: null, risks: null });
const layoutStyle = getLayoutVars();

const profileName = computed(() => {
  if (loading.value) return "资料加载中";
  return profile.value?.name || "咨询师";
});

const profileAvatar = computed(() => resolveApiAssetUrl(profile.value?.avatar) || BRAND_ASSETS.defaultCounselorAvatar);

const profileDesc = computed(() => {
  const title = profile.value?.title || "心理咨询师";
  const campus = profile.value?.campus?.name || "心理中心";
  return `${title} · ${campus}`;
});

const statusText = computed(() => {
  const status = profile.value?.status === "active" ? "在线" : "状态待确认";
  return `${status} · 今日可接待`;
});

const specialties = computed(() => {
  const list = profile.value?.specialties;
  return Array.isArray(list) ? list.filter(Boolean) : [];
});

onShow(() => {
  loadProfile();
  loadProfileStats();
});

async function loadProfile() {
  loading.value = true;
  error.value = "";
  try {
    profile.value = await getCounselorProfile();
  } catch (err) {
    error.value = err.message || "资料读取失败";
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function loadProfileStats() {
  profileStats.value = { students: null, completed: null, risks: null };
  const [students, completed, risks] = await Promise.allSettled([
    getCounselorStudents(),
    getCounselorAppointments({ status: "completed" }),
    getCounselorRiskRecords({ status: "open" })
  ]);
  profileStats.value = {
    students: countFulfilled(students),
    completed: countFulfilled(completed),
    risks: countFulfilled(risks)
  };
}

function countFulfilled(result) {
  if (result.status !== "fulfilled") return null;
  return Array.isArray(result.value) ? result.value.length : 0;
}

function statText(value) {
  return value === null || value === undefined ? "--" : String(value);
}

function go(url) {
  goPage(url);
}

function logout() {
  clearSession();
  uni.reLaunch({ url: "/pages/login/login?role=counselor" });
}
</script>

<style scoped>
.counselor-profile-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.profile-status {
  color: #fff;
  background: #4A90D9;
}

.profile-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 44rpx;
  bottom: 0;
}

.profile-stack {
  display: grid;
  gap: 24rpx;
  padding: 0 32rpx 170rpx;
  overflow-x: hidden;
}

.profile-hero {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 10rpx;
  margin: 0 -32rpx;
  padding: 46rpx 32rpx 92rpx;
  color: #fff;
  background: linear-gradient(135deg, #4A90D9 0%, #357ABD 100%);
  border-radius: 0 0 44rpx 44rpx;
}

.edit-btn {
  position: absolute;
  right: 32rpx;
  top: 26rpx;
  width: 92rpx;
  height: 54rpx;
  border-radius: 999rpx;
  color: #fff;
  background: rgba(255,255,255,.18);
  font-size: 22rpx;
  font-weight: 800;
}

.hero-avatar {
  width: 132rpx;
  height: 132rpx;
  display: grid;
  place-items: center;
  border: 6rpx solid rgba(255,255,255,.45);
  border-radius: 50%;
  color: #4A90D9;
  background: #fff;
  font-size: 44rpx;
  font-weight: 900;
}

.hero-avatar-image {
  display: block;
  background: #DBEAFE;
}

.hero-name {
  font-size: 36rpx;
  font-weight: 900;
}

.hero-desc {
  color: rgba(255,255,255,.86);
  font-size: 24rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.online-badge {
  margin-top: 8rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #DCFCE7;
  background: rgba(255,255,255,.16);
  font-size: 21rpx;
  font-weight: 800;
}

.stats-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: -70rpx;
  padding: 26rpx 0;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 10rpx 28rpx rgba(37,99,235,.1);
  z-index: 2;
}

.stats-card view {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 6rpx;
  border-right: 1rpx solid #F3F4F6;
}

.stats-card view:last-child {
  border-right: 0;
}

.stat-num {
  color: #4A90D9;
  font-size: 32rpx;
  font-weight: 900;
}

.stat-label {
  color: #94A3B8;
  font-size: 20rpx;
}

.proto-card {
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37,99,235,.06);
}

.specialty-card {
  display: grid;
  gap: 20rpx;
  padding: 28rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.section-head button {
  width: 86rpx;
  height: 48rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 21rpx;
  font-weight: 900;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.tag-list text {
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 800;
}

.menu-card {
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  min-height: 104rpx;
  padding: 22rpx 28rpx;
  border-bottom: 1rpx solid #F3F4F6;
  border-radius: 0;
  background: #fff;
  text-align: left;
}

.menu-item:last-child {
  border-bottom: 0;
}

.menu-icon {
  width: 68rpx;
  height: 68rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 20rpx;
}

.menu-icon .mini-icon {
  width: 36rpx;
  height: 36rpx;
}

.menu-icon.blue { color: #4A90D9; background: #DBEAFE; }
.menu-icon.orange { color: #F97316; background: #FFEDD5; }
.menu-icon.green { color: #16A34A; background: #DCFCE7; }
.menu-icon.pink { color: #F472B6; background: #FCE7F3; }

.menu-title,
.menu-desc {
  display: block;
}

.menu-title {
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.menu-desc {
  margin-top: 6rpx;
  color: #94A3B8;
  font-size: 21rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.chevron {
  margin-left: auto;
  color: #CBD5E1;
  font-size: 40rpx;
}

.logout-btn {
  height: 86rpx;
  border-radius: 22rpx;
  color: #EF4444;
  background: #fff;
  font-size: 26rpx;
  font-weight: 900;
}
</style>
