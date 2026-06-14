<template>
  <view class="mobile-container stu-page" :style="layoutStyle">
    <status-bar />

    <view class="stu-content">
      <scroll-view class="stu-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="stu-profile-hero">
          <button class="stu-profile-avatar-button" :disabled="uploadingAvatar" @click="chooseAvatar">
            <image class="stu-profile-avatar" mode="aspectFill" :src="profileAvatar" />
            <view class="stu-profile-avatar-badge">
              <text>{{ uploadingAvatar ? "..." : "+" }}</text>
            </view>
          </button>
          <view>
            <text class="stu-profile-title">{{ profileName }}</text>
            <text class="stu-profile-subtitle">{{ profileSubtitle }}</text>
          </view>
        </view>

        <view class="stu-card stu-stat-card">
          <view class="stu-stat-grid">
            <view><text class="stu-stat-number">{{ statText(profileStats.appointments) }}</text><text class="stu-muted">咨询次数</text></view>
            <view><text class="stu-stat-number">{{ statText(profileStats.assessments) }}</text><text class="stu-muted">测评记录</text></view>
            <view><text class="stu-stat-number">{{ statText(profileStats.activities) }}</text><text class="stu-muted">报名活动</text></view>
          </view>
        </view>

        <view class="stu-menu-list">
          <view class="stu-card stu-menu-card">
            <button v-for="item in mainMenus" :key="item.label" class="stu-menu-item" @click="go(item.url)">
              <view :class="['stu-icon-box', item.tone]"><view :class="['mini-icon', item.icon]"></view></view>
              <view class="stu-menu-main">
                <text class="stu-title" style="font-size: 28rpx;">{{ item.label }}</text>
                <text class="stu-muted">{{ item.desc }}</text>
              </view>
              <text class="stu-chevron">›</text>
            </button>
          </view>

          <view class="stu-card stu-menu-card">
            <button class="stu-menu-item" @click="go('/pages/student/emergency')">
              <view class="stu-icon-box red"><view class="mini-icon alert"></view></view>
              <view class="stu-menu-main">
                <text class="stu-title" style="font-size: 28rpx;">紧急帮助</text>
                <text class="stu-muted">24小时心理援助热线</text>
              </view>
              <text class="stu-chevron">›</text>
            </button>
            <button class="stu-menu-item" @click="logout">
              <view class="stu-icon-box gray"><view class="mini-icon close"></view></view>
              <view class="stu-menu-main">
                <text class="stu-title" style="font-size: 28rpx; color: #ef4444;">退出登录</text>
                <text class="stu-muted">退出当前账号</text>
              </view>
            </button>
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
import { clearSession, getUser, resolveApiAssetUrl, updateCurrentUser } from "../../api/client";
import { getActivitySignups, getAppointments, getAssessmentResults, getStudentProfile, uploadStudentAvatar } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";
import { getLayoutVars } from "@/utils/layout";

const loadingProfile = ref(false);
const uploadingAvatar = ref(false);
const profile = ref(null);
const profileStats = ref({ appointments: 0, assessments: 0, activities: 0 });
const layoutStyle = getLayoutVars();

const profileName = computed(() => {
  if (loadingProfile.value) return "资料加载中";
  return profile.value?.name || "学生";
});

const profileAvatar = computed(() => resolveApiAssetUrl(profile.value?.avatar) || BRAND_ASSETS.defaultStudentAvatar);

const profileSubtitle = computed(() => {
  const college = profile.value?.college || "学院待确认";
  const grade = profile.value?.grade || "年级待确认";
  return `${college} · ${grade}`;
});

const mainMenus = [
  { label: "编辑资料", desc: "修改个人信息和联系方式", icon: "profile", tone: "purple", url: "/pages/student/profile-edit" },
  { label: "我的预约", desc: "查看和管理预约记录", icon: "calendar", tone: "", url: "/pages/student/appointments" },
  { label: "测评历史", desc: "查看心理测评记录和结果", icon: "clipboard", tone: "orange", url: "/pages/student/assessment-history" },
  { label: "我的活动", desc: "查看已报名的心理活动", icon: "check", tone: "green", url: "/pages/student/my-activities" },
  { label: "消息中心", desc: "查看通知和咨询师留言", icon: "bell", tone: "green", url: "/pages/student/messages" },
  { label: "常见问题", desc: "查看FAQ了解心理咨询", icon: "book", tone: "purple", url: "/pages/student/faq" },
  { label: "隐私政策", desc: "了解个人信息保护", icon: "alert", tone: "orange", url: "/pages/student/privacy" },
  { label: "意见反馈", desc: "提交系统问题和使用建议", icon: "more", tone: "", url: "/pages/student/feedback-form" }
];

onShow(() => {
  loadProfile();
  loadProfileStats();
});

async function loadProfile() {
  loadingProfile.value = true;
  try {
    profile.value = await getStudentProfile();
  } catch (error) {
    profile.value = null;
    uni.showToast({ title: error.message || "资料加载失败", icon: "none" });
  } finally {
    loadingProfile.value = false;
  }
}

async function loadProfileStats() {
  profileStats.value = { appointments: 0, assessments: 0, activities: 0 };
  const [appointments, assessments, activities] = await Promise.allSettled([
    getAppointments({ status: "completed" }),
    getAssessmentResults(),
    getActivitySignups()
  ]);
  profileStats.value = {
    appointments: countFulfilled(appointments),
    assessments: countFulfilled(assessments),
    activities: countFulfilled(activities)
  };
}

function countFulfilled(result) {
  if (result.status !== "fulfilled") return 0;
  const value = result.value;
  if (Array.isArray(value)) return value.length;
  if (value && Object.prototype.hasOwnProperty.call(value, "total") && value.total !== null && value.total !== undefined) {
    const total = Number(value.total);
    if (Number.isFinite(total)) return total;
  }
  if (Array.isArray(value?.items)) return value.items.length;
  return 0;
}

function statText(value) {
  return value === null || value === undefined ? "--" : String(value);
}

function go(url) {
  goPage(url);
}

function chooseAvatar() {
  if (uploadingAvatar.value || loadingProfile.value) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success(result) {
      const filePath = result.tempFilePaths?.[0];
      if (filePath) uploadAvatar(filePath);
    },
    fail(error) {
      if (!/cancel/i.test(error.errMsg || "")) {
        uni.showToast({ title: error.errMsg || "未选择头像", icon: "none" });
      }
    }
  });
}

async function uploadAvatar(filePath) {
  uploadingAvatar.value = true;
  try {
    const data = await uploadStudentAvatar(filePath);
    const avatar = data?.profile?.avatar || data?.avatar;
    if (!avatar) throw new Error("头像上传响应缺少头像地址");

    const nextProfile = {
      ...(profile.value || {}),
      ...(data?.profile || {}),
      avatar
    };
    profile.value = nextProfile;
    updateCurrentUser({ user: { ...(getUser() || {}), ...nextProfile, avatar } });
    uni.showToast({ title: "头像已更新", icon: "none" });
  } catch (error) {
    uni.showToast({ title: error.message || "头像上传失败", icon: "none" });
  } finally {
    uploadingAvatar.value = false;
  }
}

function logout() {
  clearSession();
  uni.reLaunch({ url: "/pages/login/login" });
}
</script>

<style scoped>
/* 上线前自适应收口：个人中心资料字段为空或过长时不撑破布局。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.stu-profile-default-avatar {
  background: #eef6ff;
}

.stu-profile-avatar-button {
  width: 128rpx;
  height: 128rpx;
  position: relative;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 999rpx;
  line-height: 1;
  background: transparent;
}

.stu-profile-avatar-button::after {
  border: 0;
}

.stu-profile-avatar-button[disabled] {
  opacity: .82;
}

.stu-profile-avatar-badge {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, .92);
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 26rpx;
  font-weight: 900;
  box-sizing: border-box;
}
</style>
