<template>
  <view class="mobile-container sp-page cp-page">
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
      <text class="sp-header-title">个人资料</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-no-tabbar">
          <view class="counselor-avatar-panel">
            <button class="avatar-upload-button" :disabled="uploadingAvatar || loading" @click="chooseAvatar">
              <image class="avatar-image" mode="aspectFill" :src="avatarPreview" />
              <view class="avatar-camera"><text>＋</text></view>
            </button>
            <text class="avatar-hint">{{ uploadingAvatar ? "头像上传中..." : "点击更换头像" }}</text>
          </view>

          <view class="sp-card cp-section-card">
            <text class="cp-section-title">基本资料</text>
            <view class="cp-form-grid">
              <view class="sp-field">
                <text class="sp-label">姓名</text>
                <input class="sp-input" disabled :value="form.name" />
              </view>
              <view class="sp-field">
                <text class="sp-label">工号</text>
                <input class="sp-input" disabled :value="form.jobNo" />
              </view>
              <view class="sp-field">
                <text class="sp-label">职称</text>
                <input class="sp-input" disabled :value="form.title" />
              </view>
              <view class="sp-field">
                <text class="sp-label">联系电话</text>
                <input v-model="form.phone" class="sp-input" type="tel" placeholder="请输入联系电话" />
              </view>
              <view class="sp-field">
                <text class="sp-label">擅长领域</text>
                <textarea v-model="form.specialtiesText" class="sp-textarea" placeholder="多个领域用顿号或逗号分隔" />
              </view>
              <view class="sp-field">
                <text class="sp-label">个人简介</text>
                <textarea v-model="form.introduction" class="sp-textarea" placeholder="请输入个人简介" />
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="sp-bottom-actions">
      <button class="sp-primary" :disabled="saving || loading" :loading="saving" @click="save">
        {{ saving ? "保存中..." : "保存资料" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { resolveApiAssetUrl, updateCurrentUser } from "../../api/client";
import { getCounselorProfile, updateCounselorProfile, uploadCounselorAvatar } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const saving = ref(false);
const uploadingAvatar = ref(false);
const form = reactive({
  name: "",
  jobNo: "",
  title: "",
  phone: "",
  avatar: "",
  specialtiesText: "",
  introduction: ""
});

const avatarPreview = computed(() => resolveApiAssetUrl(form.avatar) || BRAND_ASSETS.defaultCounselorAvatar);

onShow(() => {
  loadProfile();
});

async function loadProfile() {
  loading.value = true;
  try {
    const profile = await getCounselorProfile();
    form.name = profile?.name || "";
    form.jobNo = profile?.jobNo || "";
    form.title = profile?.title || "心理咨询师";
    form.phone = profile?.phone || "";
    form.avatar = profile?.avatar || "";
    form.specialtiesText = Array.isArray(profile?.specialties) ? profile.specialties.join("、") : "";
    form.introduction = profile?.introduction || "";
  } catch (error) {
    uni.showToast({ title: error.message || "资料读取失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function chooseAvatar() {
  if (uploadingAvatar.value || loading.value) return;
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
    const data = await uploadCounselorAvatar(filePath);
    applyProfile(data?.profile || { avatar: data?.avatar });
    if (data?.profile) updateCurrentUser({ user: data.profile });
    uni.showToast({ title: "头像已更新", icon: "none" });
  } catch (error) {
    uni.showToast({ title: error.message || "头像上传失败", icon: "none" });
  } finally {
    uploadingAvatar.value = false;
  }
}

function applyProfile(profile = {}) {
  form.name = profile?.name || form.name || "";
  form.jobNo = profile?.jobNo || form.jobNo || "";
  form.title = profile?.title || form.title || "心理咨询师";
  form.phone = profile?.phone || form.phone || "";
  form.avatar = profile?.avatar || form.avatar || "";
  form.specialtiesText = Array.isArray(profile?.specialties) ? profile.specialties.join("、") : form.specialtiesText;
  form.introduction = profile?.introduction || form.introduction || "";
}

async function save() {
  if (saving.value || loading.value) return;
  saving.value = true;
  try {
    const profile = await updateCounselorProfile({
      phone: form.phone,
      avatar: form.avatar,
      specialties: parseSpecialties(form.specialtiesText),
      introduction: form.introduction
    });
    applyProfile(profile);
    updateCurrentUser({ user: profile });
    uni.showToast({ title: "资料已保存", icon: "success" });
    setTimeout(back, 500);
  } catch (error) {
    uni.showToast({ title: error.message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}

function parseSpecialties(value = "") {
  return String(value).split(/[、,，;；]/).map((item) => item.trim()).filter(Boolean);
}

function back() {
  safeBackCounselor("/pages/counselor/profile");
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.counselor-avatar-panel {
  display: grid;
  justify-items: center;
  gap: 16rpx;
  padding: 24rpx 0 6rpx;
}

.avatar-upload-button {
  position: relative;
  width: 156rpx;
  height: 156rpx;
  display: grid;
  place-items: center;
  padding: 0;
  border: 6rpx solid #fff;
  border-radius: 999rpx;
  color: #fff;
  background: #eef6ff;
  box-shadow: 0 14rpx 30rpx rgba(74,144,217,.18);
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1;
}

.avatar-upload-button::after {
  border: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 999rpx;
}

.avatar-default-image {
  background: #eef6ff;
}

.avatar-camera {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 48rpx;
  height: 48rpx;
  display: grid;
  place-items: center;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 26rpx;
  font-weight: 900;
}

.avatar-hint {
  color: #4A90D9;
  font-size: 23rpx;
  font-weight: 800;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.cp-section-title,
.sp-label,
.sp-input,
.sp-textarea {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.sp-textarea {
  min-height: 180rpx;
}
</style>
