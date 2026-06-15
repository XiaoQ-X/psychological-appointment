<template>
  <view class="mobile-container password-page" :style="layoutStyle">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="password-hero">
      <view class="password-icon">
        <image mode="aspectFit" :src="BRAND_ASSETS.loginCenterLogo" />
      </view>
      <text class="password-title">首次登录安全设置</text>
      <text class="password-subtitle">请先设置新的登录密码</text>
      <text class="password-caption">完成修改后才能进入业务页面</text>
    </view>

    <view class="password-card">
      <input v-model="form.oldPassword" class="password-input" data-testid="mini-old-password" password placeholder="请输入临时密码" />
      <input v-model="form.newPassword" class="password-input" data-testid="mini-new-password" password placeholder="至少8位，包含字母和特殊字符" />
      <input v-model="form.confirmPassword" class="password-input" data-testid="mini-confirm-password" password placeholder="再次输入新密码" @confirm="submit" />
      <text class="password-policy">新密码不能为纯数字、常见弱密码或与临时密码相同。</text>
      <button class="password-submit" data-testid="mini-change-password-submit" :loading="submitting" :disabled="submitting" @click="submit">
        {{ submitting ? "修改中..." : "完成修改并进入" }}
      </button>
      <button class="password-exit" :disabled="submitting" @click="exit">退出当前账号</button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from "vue";
import { changePassword, getRole, logoutLocal, updateCurrentUser } from "../../api/auth";
import { getLayoutVars } from "../../utils/layout";
import { BRAND_ASSETS } from "../../utils/brand";

const layoutStyle = getLayoutVars();
const submitting = ref(false);
const form = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: ""
});

async function submit() {
  if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
    toast("请完整填写密码信息");
    return;
  }
  if (form.newPassword !== form.confirmPassword) {
    toast("两次输入的新密码不一致");
    return;
  }
  submitting.value = true;
  try {
    const data = await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    });
    updateCurrentUser(data);
    const role = data.role || getRole();
    uni.showToast({ title: "密码修改成功", icon: "success" });
    setTimeout(() => {
      uni.reLaunch({
        url: role === "counselor" ? "/pages/counselor/dashboard" : "/pages/student/home"
      });
    }, 450);
  } catch (error) {
    toast(error.message || "密码修改失败");
  } finally {
    submitting.value = false;
  }
}

function exit() {
  logoutLocal();
  uni.reLaunch({ url: "/pages/login/login" });
}

function toast(title) {
  uni.showToast({ title, icon: "none" });
}
</script>

<style scoped>
.password-page {
  min-height: 100vh;
  color: #172033;
  background: #edf4fb;
}

.password-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx 96rpx;
  color: #fff;
  background: #2563a8;
}

.password-icon {
  width: 88rpx;
  height: 88rpx;
  display: grid;
  place-items: center;
  margin-bottom: 22rpx;
  border: 2rpx solid rgba(255, 255, 255, .55);
  border-radius: 44rpx;
  background: rgba(255, 255, 255, .18);
  font-size: 28rpx;
  font-weight: 800;
}

.password-icon image {
  width: 58rpx;
  height: 58rpx;
}

.password-title {
  font-size: 38rpx;
  font-weight: 800;
}

.password-subtitle {
  margin-top: 14rpx;
  font-size: 28rpx;
}

.password-caption {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, .78);
  font-size: 24rpx;
}

.password-card {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin: -54rpx 28rpx 40rpx;
  padding: 36rpx 30rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(31, 74, 125, .14);
}

.password-input {
  min-height: 92rpx;
  padding: 0 26rpx;
  border: 2rpx solid #dbe5f0;
  border-radius: 12rpx;
  background: #f8fafc;
  font-size: 28rpx;
}

.password-policy {
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.6;
}

.password-submit,
.password-exit {
  min-height: 88rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.password-submit {
  color: #fff;
  background: #2563a8;
}

.password-exit {
  color: #64748b;
  background: transparent;
}
</style>
