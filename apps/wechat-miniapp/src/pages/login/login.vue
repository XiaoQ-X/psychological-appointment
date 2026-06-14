<template>
  <view class="mobile-container sp-page proto-login-page" :class="role === 'counselor' ? 'teacher-mode' : 'student-mode'" :style="layoutStyle">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="login-blue-head">
      <image class="login-brand-visual" mode="aspectFill" :src="BRAND_ASSETS.loginHero" />
      <view class="login-brand-shade"></view>
      <view class="login-round-icon">
        <image class="login-logo-image" mode="aspectFit" :src="BRAND_ASSETS.loginCenterLogo" />
      </view>
      <text class="login-main-title">{{ role === 'counselor' ? `${BRAND_NAME} · 咨询师工作台` : BRAND_NAME }}</text>
      <text class="login-subtitle">{{ role === 'counselor' ? '咨询师工作台' : BRAND_POSITIONING }}</text>
      <text class="login-caption">{{ role === 'counselor' ? '仅供校内心理中心授权老师使用' : BRAND_TAGLINE }}</text>
    </view>

    <view class="login-form-shell">
      <view class="login-card">
        <text class="login-card-title">{{ role === 'counselor' ? '老师登录' : '学生登录' }}</text>

        <view class="login-input-stack">
          <input class="login-input" v-model="account" :placeholder="role === 'counselor' ? '请输入工号' : '请输入学号'" />
          <input class="login-input" v-model="password" password placeholder="请输入密码" @confirm="login" />
        </view>

        <template v-if="role === 'counselor'">
          <button class="wechat-login-btn disabled" disabled>
            <text class="wechat-dot">微</text>
            <text>请使用工号密码登录</text>
          </button>
          <view class="login-divider"><view></view><text>或</text><view></view></view>
        </template>

        <template v-else>
          <view class="login-policy-line" @click="togglePolicyAccepted">
            <view :class="['login-checkbox', { checked: policyAccepted }]"></view>
            <text>我已阅读并同意</text>
            <text class="link" @click.stop="showPolicyTip('隐私政策')">《隐私政策》</text>
            <text>和</text>
            <text class="link" @click.stop="showPolicyTip('服务协议')">《服务协议》</text>
          </view>
        </template>

        <button class="login-primary-btn" :loading="submitting" :disabled="submitting" @click="login">登录</button>

        <view v-if="role === 'student'" class="login-links">
          <text>账号由学校统一导入</text>
          <text class="muted">首次使用请联系学校心理中心</text>
        </view>
        <view v-else class="login-teacher-tip">如有账号问题请联系心理中心管理员</view>

        <view v-if="role === 'student'" class="login-emergency-line" @click="goEmergency">紧急帮助</view>
      </view>

      <view class="login-secondary-entry">
        <button @click="switchRole(role === 'student' ? 'counselor' : 'student')">
          {{ role === 'student' ? '咨询师登录' : '返回学生登录' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getCurrentUser, getToken, loginCounselor, loginStudent, updateCurrentUser } from "../../api/auth";
import { getLayoutVars } from "../../utils/layout";
import { BRAND_ASSETS, BRAND_NAME, BRAND_POSITIONING, BRAND_TAGLINE } from "@/utils/brand";

const role = ref("student");
const account = ref("");
const password = ref("");
const submitting = ref(false);
const policyAccepted = ref(false);
const layoutStyle = getLayoutVars();

onLoad((query = {}) => {
  if (query.role === "counselor") role.value = "counselor";
  restoreCurrentUser();
});

function switchRole(nextRole) {
  role.value = nextRole;
  account.value = "";
  password.value = "";
  policyAccepted.value = false;
}

async function login() {
  if (!account.value.trim() || !password.value) {
    toast(role.value === "counselor" ? "请输入工号和密码" : "请输入学号和密码");
    return;
  }
  if (role.value === "student" && !policyAccepted.value) {
    toast("请先阅读并同意隐私政策和服务协议");
    return;
  }
  submitting.value = true;
  try {
    const data = role.value === "counselor"
      ? await loginCounselor({ jobNo: account.value.trim(), password: password.value })
      : await loginStudent({ studentNo: account.value.trim(), password: password.value, policyAccepted: policyAccepted.value });
    routeByRole(data.role);
  } catch (error) {
    toast(error.message || "登录失败");
  } finally {
    submitting.value = false;
  }
}

async function restoreCurrentUser() {
  if (!getToken()) return;
  try {
    const data = await getCurrentUser();
    updateCurrentUser(data);
    routeByRole(data.role);
  } catch (error) {
    // 401 会由统一 request 清理登录态并回到登录页。
  }
}

function routeByRole(nextRole) {
  if (nextRole === "student") {
    uni.reLaunch({ url: "/pages/student/home" });
    return;
  }
  if (nextRole === "counselor") {
    uni.reLaunch({ url: "/pages/counselor/dashboard" });
    return;
  }
  toast("账号角色不支持进入小程序");
}

function goEmergency() {
  uni.navigateTo({ url: "/pages/student/emergency" });
}

function togglePolicyAccepted() {
  policyAccepted.value = !policyAccepted.value;
}

function showPolicyTip(name) {
  toast(`${name}请登录后在个人中心查看`);
}

function toast(title) {
  uni.showToast({ title, icon: "none" });
}
</script>

<style scoped>
.proto-login-page {
  background: #f8fafc;
  overflow-x: hidden;
  --login-card-overlap-offset: 0rpx;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.login-blue-head {
  position: relative;
  min-height: 360rpx;
  display: grid;
  justify-items: center;
  align-content: start;
  padding: 42rpx 40rpx 72rpx;
  color: #fff;
  background: linear-gradient(135deg, #4A90D9 0%, #357ABD 100%);
  text-align: center;
  overflow: hidden;
}

.login-brand-visual,
.login-brand-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.login-brand-visual {
  opacity: .70;
}

.login-brand-shade {
  background: linear-gradient(180deg, rgba(8, 26, 34, .16) 0%, rgba(8, 26, 34, .76) 100%);
}

.login-round-icon {
  position: relative;
  z-index: 1;
  width: 112rpx;
  height: 112rpx;
  display: grid;
  place-items: center;
  margin-bottom: 32rpx;
  border-radius: 999rpx;
  background: rgba(255,255,255,.22);
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, .18);
  overflow: hidden;
}

.login-logo-image {
  width: 96rpx;
  height: 96rpx;
  border-radius: 999rpx;
}

.login-main-title {
  position: relative;
  z-index: 1;
  font-size: 46rpx;
  line-height: 1.18;
  font-weight: 900;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,.25);
}

.teacher-mode .login-main-title {
  font-size: 38rpx;
}

.login-subtitle {
  position: relative;
  z-index: 1;
  margin-top: 10rpx;
  color: rgba(255,255,255,.84);
  font-size: 26rpx;
}

.login-caption {
  position: relative;
  z-index: 1;
  max-width: 560rpx;
  margin-top: 8rpx;
  color: rgba(255,255,255,.78);
  font-size: 22rpx;
}

.login-form-shell {
  position: relative;
  flex: 0 0 auto;
  padding: 0 40rpx 40rpx;
  margin-top: var(--login-card-overlap-offset);
  box-sizing: border-box;
  overflow: visible;
}

.proto-login-page .login-form-shell {
  margin-top: 32rpx !important;
}

.login-card {
  width: auto;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  display: grid;
  gap: 28rpx;
  padding: 46rpx 40rpx 46rpx;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 4rpx 18rpx rgba(15,23,42,.06);
}

.login-card-title {
  color: #111827;
  font-size: 30rpx;
  font-weight: 900;
  text-align: center;
}

.login-input-stack {
  display: grid;
  gap: 26rpx;
  margin-top: 14rpx;
}

.login-input {
  height: 96rpx;
  padding: 0 28rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  color: #111827;
  background: #f9fafb;
  font-size: 26rpx;
}

.login-policy-line {
  min-height: 88rpx;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
  padding: 4rpx 0;
}

.login-policy-line .link {
  color: #4A90D9;
  text-decoration: underline;
}

.login-checkbox {
  position: relative;
  width: 36rpx;
  height: 36rpx;
  flex: 0 0 36rpx;
  border: 1.5rpx solid #9ca3af;
  border-radius: 5rpx;
  background: #fff;
}

.login-checkbox.checked {
  border-color: #4A90D9;
  background: #4A90D9;
}

.login-checkbox.checked::after {
  content: "";
  position: absolute;
  left: 11rpx;
  top: 5rpx;
  width: 9rpx;
  height: 17rpx;
  border-right: 3rpx solid #fff;
  border-bottom: 3rpx solid #fff;
  transform: rotate(45deg);
}

.login-primary-btn,
.wechat-login-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  border-radius: 24rpx;
  color: #fff;
  background: linear-gradient(135deg, #4A90D9, #357ABD);
  box-shadow: 0 8rpx 20rpx rgba(74,144,217,.24);
  font-size: 28rpx;
  font-weight: 900;
}

.wechat-login-btn {
  background: #07C160;
  box-shadow: none;
}

.wechat-login-btn.disabled {
  color: #64748B;
  background: #F1F5F9;
}

.wechat-login-btn.disabled .wechat-dot {
  color: #64748B;
}

.wechat-dot {
  width: 34rpx;
  height: 34rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #07C160;
  background: #fff;
  font-size: 18rpx;
  font-weight: 900;
}

.login-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 22rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.login-divider view {
  height: 1rpx;
  background: #f3f4f6;
}

.login-links {
  display: grid;
  justify-items: center;
  gap: 14rpx;
  padding-top: 10rpx;
}

.login-links text {
  color: #4A90D9;
  font-size: 26rpx;
  font-weight: 800;
}

.login-links .muted {
  color: #9ca3af;
  font-size: 23rpx;
  font-weight: 600;
}

.login-teacher-tip {
  color: #9ca3af;
  font-size: 23rpx;
  text-align: center;
}

.login-emergency-line {
  display: flex;
  justify-content: center;
  min-height: 88rpx;
  align-items: center;
  padding-top: 12rpx;
  border-top: 1rpx solid #f3f4f6;
  color: #f97316;
  font-size: 26rpx;
  font-weight: 800;
}

.login-secondary-entry {
  display: flex;
  justify-content: center;
  margin-top: 22rpx;
  width: 100%;
  box-sizing: border-box;
}

.login-secondary-entry button {
  min-width: 240rpx;
  min-height: 88rpx;
  line-height: 88rpx;
  color: #4A90D9;
  background: transparent;
  font-size: 24rpx;
  font-weight: 700;
}
</style>
