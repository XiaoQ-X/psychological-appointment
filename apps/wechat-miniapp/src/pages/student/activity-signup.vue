<template>
  <view class="mobile-container sp-page signup-page">
    <status-bar />
    <page-header title="活动报名" show-back @back="goBack" />

    <scroll-view class="signup-content" scroll-y enhanced :show-scrollbar="false">
      <view v-if="!submitted" class="signup-stack">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view v-if="errorText" class="signup-error-card">
          <text>{{ errorText }}</text>
          <button @click="go('/pages/student/activities')">返回活动列表</button>
        </view>

        <view class="activity-info-card">
          <view class="signup-section-title">
            <view class="mini-icon clipboard"></view>
            <text>活动信息</text>
          </view>
          <view class="activity-info-inner">
            <text class="activity-title">{{ activity.title }}</text>
            <view class="activity-meta-row">
              <view class="mini-icon calendar"></view>
              <text>时间：{{ activity.time }}</text>
            </view>
            <view class="activity-meta-row">
              <view class="mini-icon school"></view>
              <text>地点：{{ activity.location }}</text>
            </view>
            <view class="activity-meta-row">
              <view class="mini-icon group"></view>
              <text>报名人数：{{ activity.signupText }}</text>
            </view>
          </view>
        </view>

        <view class="signup-section-title form-title">
          <view class="mini-icon clipboard"></view>
          <text>报名信息</text>
        </view>

        <view class="signup-field">
          <text class="signup-label">姓名</text>
          <view class="signup-input readonly">{{ form.name }}</view>
        </view>
        <view class="signup-field">
          <text class="signup-label">学号</text>
          <view class="signup-input readonly">{{ form.studentNo }}</view>
        </view>
        <view class="signup-field">
          <text class="signup-label">联系方式</text>
          <input v-model="form.phone" class="signup-input" placeholder="请输入手机号" />
        </view>
        <view class="signup-field">
          <text class="signup-label">是否有当前心理困扰</text>
          <view class="distress-row">
            <button :class="['distress-option', distress ? 'active' : '']" @click="distress = true">
              <view class="radio-dot"></view>
              <text>是</text>
            </button>
            <button :class="['distress-option', !distress ? 'active' : '']" @click="distress = false">
              <view class="radio-dot"></view>
              <text>否</text>
            </button>
          </view>
        </view>
        <view class="signup-field">
          <text class="signup-label">期望收获（选填）</text>
          <textarea v-model="form.remark" class="signup-textarea" placeholder="你希望通过本次活动获得什么？" />
        </view>

        <view class="signup-note">
          <view class="note-icon">i</view>
          <text>提交报名后不可自行取消，如需取消请联系心理中心。</text>
        </view>

        <view class="signup-actions">
          <button class="signup-cancel" @click="goBack">取消</button>
          <button class="signup-submit" :loading="submitting" :disabled="submitting || loading || !activityId || !!errorText" @click="submitSignup">提交报名</button>
        </view>
      </view>

      <view v-else class="signup-success">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view class="success-icon">✓</view>
        <text class="success-title">报名成功！</text>
        <text class="success-desc">活动开始前会通过消息通知你</text>
        <view class="success-card">
          <view class="success-row"><text>活动</text><text class="success-value">{{ activity.title }}</text></view>
          <view class="success-row">
            <text>状态</text>
            <text class="success-pill">报名成功</text>
          </view>
        </view>
        <button class="signup-submit full" @click="go('/pages/student/my-activities')">查看我的活动</button>
        <button class="signup-cancel full" @click="go('/pages/student/activities')">返回活动列表</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getUser } from "../../api/client";
import { getActivityDetail, signupActivity } from "../../api/student";
import { goPage, goPrimaryPage, replacePage, safeBackStudent } from "@/utils/navigation";

const submitted = ref(false);
const distress = ref(true);
const activityId = ref("");
const errorText = ref("");
const loading = ref(false);
const submitting = ref(false);
const activity = ref(defaultActivity());
const form = ref({
  name: "",
  studentNo: "",
  phone: "",
  remark: ""
});

onLoad((query = {}) => {
  activityId.value = query.id || "";
  const user = getUser() || {};
  form.value.name = user.name || user.profile?.name || "姓名待确认";
  form.value.studentNo = user.studentNo || user.profile?.studentNo || user.account || "学号待确认";
  form.value.phone = user.phone || user.profile?.phone || "";
  loadActivity();
});

async function loadActivity() {
  if (!activityId.value) {
    errorText.value = "缺少活动信息，请返回活动列表重新进入。";
    uni.showToast({ title: "缺少活动 ID", icon: "none" });
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getActivityDetail(activityId.value);
    activity.value = normalizeActivity(detail);
  } catch (error) {
    errorText.value = error.message || "活动信息加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "活动信息加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function defaultActivity() {
  return {
    id: "",
    title: "活动加载中",
    time: "时间待确认",
    location: "地点待确认",
    signupText: "待确认"
  };
}

function normalizeActivity(item = {}) {
  const capacity = Number(item.capacity || 0);
  const signupCount = Number(item.signupCount ?? item.signups?.filter?.((signup) => signup.status === "signed").length ?? 0);
  return {
    id: item.id || activityId.value,
    title: item.title || "未命名活动",
    time: formatRange(item.startAt, item.endAt),
    location: item.location || "地点待确认",
    signupText: capacity > 0 ? `${signupCount}/${capacity}` : `${signupCount}`
  };
}

async function submitSignup() {
  if (!activityId.value || submitting.value || errorText.value) return;
  submitting.value = true;
  try {
    const signup = await signupActivity(activityId.value, {
      name: form.value.name,
      phone: form.value.phone,
      remark: form.value.remark
    });
    uni.setStorageSync("student_latest_activity_signup", {
      signup,
      activity: activity.value
    });
    replacePage(`/pages/student/activity-signup-success?id=${signup.id}&activityId=${activityId.value}`);
  } catch (error) {
    uni.showToast({ title: error.message || "报名失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
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
  if (url === "/pages/student/activities" || url === "/pages/student/my-activities") {
    goPrimaryPage(url);
    return;
  }
  goPage(url);
}

function goBack() {
  safeBackStudent(activityId.value ? `/pages/student/activity-detail?id=${activityId.value}` : "/pages/student/activities");
}
</script>

<style scoped>
.signup-page {
  background: #f8fafc;
}

.signup-content {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.signup-stack {
  padding: 40rpx;
}

.signup-error-card {
  display: grid;
  gap: 20rpx;
  margin-bottom: 32rpx;
  padding: 28rpx;
  border: 1rpx solid #fecaca;
  border-radius: 24rpx;
  color: #b91c1c;
  background: #fef2f2;
  font-size: 24rpx;
}

.signup-error-card button {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.activity-info-card {
  padding: 32rpx;
  margin-bottom: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #f9fafb;
}

.signup-section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.signup-section-title .mini-icon {
  width: 36rpx;
  height: 36rpx;
  color: #4A90D9;
}

.form-title {
  margin: 8rpx 0 28rpx;
}

.activity-info-inner {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 32rpx;
  border-radius: 24rpx;
  background: #fff;
}

.activity-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
}

.activity-meta-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.activity-meta-row .mini-icon {
  width: 28rpx;
  height: 28rpx;
  color: #9ca3af;
}

.signup-field {
  margin-bottom: 28rpx;
}

.signup-label {
  display: block;
  margin-bottom: 12rpx;
  color: #4b5563;
  font-size: 24rpx;
  font-weight: 700;
}

.signup-input,
.signup-textarea {
  width: 100%;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  color: #1f2937;
  background: #f9fafb;
  font-size: 28rpx;
}

.signup-input {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
}

.signup-input.readonly {
  color: #6b7280;
  background: #f3f4f6;
}

.signup-textarea {
  min-height: 180rpx;
  padding: 28rpx 32rpx;
  line-height: 1.6;
}

.distress-row {
  display: flex;
  gap: 40rpx;
}

.distress-option {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 48rpx;
  color: #374151;
  font-size: 28rpx;
}

.radio-dot {
  width: 32rpx;
  height: 32rpx;
  border: 2rpx solid #d1d5db;
  border-radius: 999rpx;
  background: #fff;
}

.distress-option.active .radio-dot {
  border: 10rpx solid #4A90D9;
}

.signup-note {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 24rpx 32rpx;
  margin: 8rpx 0 32rpx;
  border: 1rpx solid #fde68a;
  border-radius: 24rpx;
  color: #b45309;
  background: #fffbeb;
  font-size: 24rpx;
  line-height: 1.5;
}

.note-icon {
  width: 32rpx;
  height: 32rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #fff;
  background: #f59e0b;
  font-size: 20rpx;
  font-weight: 900;
}

.signup-actions {
  display: flex;
  gap: 24rpx;
  padding-bottom: 48rpx;
}

.signup-cancel,
.signup-submit {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.signup-cancel {
  flex: 1;
  color: #6b7280;
  border: 1rpx solid #e5e7eb;
  background: #fff;
}

.signup-submit {
  flex: 1;
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 8rpx 18rpx rgba(74, 144, 217, .16);
}

.signup-success {
  min-height: 100%;
  padding: 96rpx 40rpx 64rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.success-icon {
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  border-radius: 999rpx;
  color: #10B981;
  background: #dcfce7;
  font-size: 80rpx;
  font-weight: 900;
}

.success-title {
  color: #1f2937;
  font-size: 40rpx;
  font-weight: 900;
}

.success-desc {
  margin-top: 16rpx;
  margin-bottom: 32rpx;
  color: #9ca3af;
  font-size: 28rpx;
}

.success-card {
  width: 100%;
  padding: 40rpx;
  margin-bottom: 48rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
  text-align: left;
}

.success-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.success-value {
  color: #374151;
  font-weight: 800;
}

.success-pill {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  color: #059669;
  background: #ecfdf5;
  font-size: 20rpx;
  font-weight: 800;
}

.full {
  width: 100%;
  flex: none;
  margin-bottom: 24rpx;
}
/* 上线前自适应收口：长文本和连续字符不撑破表单。 */
text,
button,
input,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.signup-textarea,
.signup-input {
  box-sizing: border-box;
}
</style>
