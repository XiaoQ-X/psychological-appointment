<template>
  <view class="mobile-container profile-edit-page">
    <status-bar />
    <page-header title="编辑个人资料" show-back @back="goProfile" />

    <scroll-view class="profile-edit-content" scroll-y enhanced :show-scrollbar="false">
      <view class="profile-edit-inner">
        <view class="avatar-area">
          <button class="avatar-circle avatar-button" :disabled="uploadingAvatar" @click="chooseAvatar">
            <image class="avatar-image" mode="aspectFill" :src="avatarPreview" />
            <view class="camera-badge"><text class="camera-mark">＋</text></view>
          </button>
          <text class="avatar-hint">{{ uploadingAvatar ? "头像上传中..." : "点击上传头像" }}</text>
        </view>

        <view class="form-card">
          <view class="form-field">
            <text class="field-label">姓名</text>
            <input class="input-field disabled" disabled :value="form.name" />
          </view>
          <view class="form-field">
            <text class="field-label">学号</text>
            <input class="input-field disabled" disabled :value="form.studentNo" />
          </view>
          <view class="form-field">
            <text class="field-label">院系</text>
            <view class="select-field">{{ form.college }}</view>
          </view>
          <view class="form-field">
            <text class="field-label">年级</text>
            <view class="select-field">{{ form.grade }}</view>
          </view>
          <view class="form-field">
            <text class="field-label">校区</text>
            <view class="select-field">{{ campusName }}</view>
          </view>
          <view class="form-field">
            <text class="field-label">手机号<text class="required">*</text></text>
            <input v-model="form.phone" class="input-field" type="tel" placeholder="请输入手机号" />
            <text class="field-help">填写常用手机号，用于接收预约通知</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="profile-save-bar">
      <button class="save-button" :disabled="saving || loading" @click="save">{{ saving ? "保存中..." : "保存" }}</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { resolveApiAssetUrl, updateCurrentUser } from "../../api/client";
import { getStudentProfile, updateStudentProfile, uploadStudentAvatar } from "../../api/student";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPrimaryPage } from "@/utils/navigation";

const form = ref({
  name: "",
  studentNo: "",
  gender: "",
  phone: "",
  college: "",
  major: "",
  grade: "",
  className: "",
  campus: null,
  avatar: "",
  email: ""
});
const loading = ref(false);
const saving = ref(false);
const uploadingAvatar = ref(false);

const avatarPreview = computed(() => resolveApiAssetUrl(form.value.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const campusName = computed(() => form.value.campus?.name || "校区待确认");

onShow(() => {
  loadProfile();
});

async function loadProfile() {
  loading.value = true;
  try {
    const profile = await getStudentProfile();
    applyProfile(profile);
  } catch (error) {
    uni.showToast({ title: error.message || "资料加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goProfile() {
  goPrimaryPage("/pages/student/profile");
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
    const data = await uploadStudentAvatar(filePath);
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
  form.value = {
    ...form.value,
    name: profile?.name || form.value.name || "",
    studentNo: profile?.studentNo || form.value.studentNo || "",
    gender: profile?.gender || form.value.gender || "",
    phone: profile?.phone || form.value.phone || "",
    college: profile?.college || form.value.college || "",
    major: profile?.major || form.value.major || "",
    grade: profile?.grade || form.value.grade || "",
    className: profile?.className || form.value.className || "",
    campus: profile?.campus || form.value.campus || null,
    avatar: profile?.avatar || form.value.avatar || "",
    email: profile?.email || form.value.email || ""
  };
}

async function save() {
  if (saving.value || loading.value) return;
  const phone = String(form.value.phone || "").trim();
  if (!phone) {
    uni.showToast({ title: "请填写手机号", icon: "none" });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    uni.showToast({ title: "请输入有效手机号", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    const profile = await updateStudentProfile({
      phone,
      avatar: form.value.avatar || null
    });
    applyProfile(profile);
    updateCurrentUser({ user: profile });
    uni.showToast({ title: "个人资料已保存", icon: "none" });
    setTimeout(goProfile, 500);
  } catch (error) {
    uni.showToast({ title: error.message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.profile-edit-page {
  background: #f8fafc;
}

.profile-edit-content {
  flex: 1;
  min-height: 0;
  padding-bottom: 156rpx;
  background: #f8fafc;
}

.profile-edit-inner {
  padding: 32rpx 40rpx 48rpx;
}

.avatar-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
}

.avatar-circle {
  width: 160rpx;
  height: 160rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #fff;
  background: #eef6ff;
  font-size: 48rpx;
  font-weight: 900;
}

.avatar-button {
  padding: 0;
  border: 0;
  line-height: 1;
}

.avatar-button::after {
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

.camera-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  color: #fff;
  background: #4A90D9;
}

.camera-mark {
  color: #fff;
  font-size: 28rpx;
  line-height: 1;
  font-weight: 900;
}

.avatar-hint {
  margin-top: 16rpx;
  color: #4A90D9;
  font-size: 24rpx;
  font-weight: 800;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.form-field {
  display: flex;
  flex-direction: column;
}

.field-label {
  margin-bottom: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
  font-weight: 800;
}

.required {
  color: #ef4444;
}

.input-field,
.select-field {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 28rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  color: #374151;
  background: #fff;
  font-size: 28rpx;
}

.input-field.disabled {
  color: #9ca3af;
  background: #f3f4f6;
}

.select-field {
  justify-content: space-between;
}

.field-help {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 20rpx;
}

.profile-save-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28rpx 40rpx 40rpx;
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.save-button {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 900;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}
/* 上线前自适应收口：资料编辑输入项和底部按钮保持安全距离。 */
text,
button,
input {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
