<template>
  <view class="mobile-container feedback-form-page">
    <status-bar />
    <page-header title="意见反馈" show-back @back="goBack" />

    <scroll-view class="feedback-scroll" scroll-y enhanced :show-scrollbar="false">
      <view v-if="!submitted" class="feedback-inner">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view class="feedback-intro">
          <view class="intro-icon"><view class="mini-icon bell"></view></view>
          <view class="intro-copy">
            <text class="intro-title">帮助我们改进服务</text>
            <text class="intro-desc">提交系统问题和使用建议，我们会认真查看</text>
          </view>
        </view>

        <view class="feedback-card">
          <view class="form-field">
            <text class="field-label">反馈类型</text>
            <view class="type-grid">
              <button
                v-for="type in types"
                :key="type"
                :class="['type-chip', { active: form.type === type }]"
                @click="form.type = type"
              >
                {{ type }}
              </button>
            </view>
          </view>

          <view class="form-field">
            <text class="field-label">反馈内容<text class="required">*</text></text>
            <textarea v-model="form.content" class="feedback-textarea" maxlength="300" placeholder="请描述你遇到的问题或建议" />
            <text class="field-help">{{ form.content.length }}/300</text>
          </view>

          <view class="form-field">
            <text class="field-label">联系方式</text>
            <input v-model="form.contact" class="feedback-input" type="text" placeholder="手机号或邮箱，选填" />
          </view>

          <view class="privacy-tip">
            <view class="tip-icon"><view class="mini-icon check"></view></view>
            <view class="tip-copy">
              <text class="tip-title">隐私说明</text>
              <text class="tip-desc">联系方式仅用于必要时与你确认问题，不会在页面中公开展示</text>
            </view>
          </view>

          <button class="submit-button" :disabled="submitting" :loading="submitting" @click="submit">
            {{ submitting ? "提交中..." : "提交反馈" }}
          </button>
        </view>
      </view>

      <view v-else class="feedback-success">
        <view class="success-icon"><view class="mini-icon check"></view></view>
        <text class="success-title">提交成功</text>
        <text class="success-desc">感谢你的反馈，我们会尽快查看并持续改进服务体验</text>
        <button class="submit-button" @click="goBack">返回个人中心</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { reactive, ref } from "vue";
import { submitSystemFeedback } from "../../api/student";
import { safeBackStudent } from "@/utils/navigation";

// UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。
const types = ["系统问题", "体验建议", "数据错误", "其他"];
const submitted = ref(false);
const submitting = ref(false);
const form = reactive({
  type: types[0],
  content: "",
  contact: ""
});

async function submit() {
  if (submitting.value) return;
  if (!form.type) {
    uni.showToast({ title: "请选择反馈类型", icon: "none" });
    return;
  }
  if (!form.content.trim()) {
    uni.showToast({ title: "请填写反馈内容", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    await submitSystemFeedback({
      type: form.type,
      content: form.content.trim(),
      contact: form.contact.trim()
    });
    submitted.value = true;
    uni.showToast({ title: "提交成功", icon: "success" });
  } catch (error) {
    uni.showToast({ title: error.message || "提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  safeBackStudent("/pages/student/profile");
}
</script>
<style scoped>
.feedback-form-page {
  background: #f8fafc;
}

.feedback-scroll {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.feedback-inner {
  padding: 32rpx 40rpx 52rpx;
}

.feedback-intro {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-bottom: 24rpx;
  padding: 28rpx;
  border: 1rpx solid #dbeafe;
  border-radius: 32rpx;
  background: #EBF3FC;
}

.intro-icon {
  width: 72rpx;
  height: 72rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #4A90D9;
  background: #fff;
}

.intro-copy,
.tip-copy {
  flex: 1;
  min-width: 0;
}

.intro-title,
.tip-title,
.field-label {
  display: block;
  color: #1f2937;
  font-size: 26rpx;
  font-weight: 900;
}

.intro-desc,
.tip-desc,
.field-help {
  display: block;
  margin-top: 8rpx;
  color: #6b7280;
  font-size: 22rpx;
  line-height: 1.6;
}

.feedback-card {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.required {
  color: #ef4444;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.type-chip {
  min-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 999rpx;
  color: #64748b;
  background: #f9fafb;
  font-size: 24rpx;
  font-weight: 800;
}

.type-chip.active {
  color: #4A90D9;
  border-color: #bfdbfe;
  background: #EBF3FC;
}

.feedback-input,
.feedback-textarea {
  width: 100%;
  min-height: 92rpx;
  padding: 0 28rpx;
  border: 1rpx solid #e5e7eb;
  border-radius: 24rpx;
  color: #1f2937;
  background: #f9fafb;
  font-size: 26rpx;
}

.feedback-textarea {
  min-height: 220rpx;
  padding: 24rpx 28rpx;
  line-height: 1.6;
}

.privacy-tip {
  display: flex;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8fafc;
}

.tip-icon {
  width: 48rpx;
  height: 48rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #10b981;
  background: #ecfdf5;
}

.submit-button {
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  box-shadow: 0 10rpx 24rpx rgba(74, 144, 217, .2);
  font-size: 26rpx;
  font-weight: 900;
}

.feedback-success {
  display: flex;
  min-height: 650rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 80rpx 40rpx;
  text-align: center;
}

.success-icon {
  width: 128rpx;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #10b981;
  background: #ecfdf5;
}

.success-icon .mini-icon {
  width: 64rpx;
  height: 64rpx;
}

.success-title {
  color: #1f2937;
  font-size: 36rpx;
  font-weight: 900;
}

.success-desc {
  max-width: 520rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.7;
}
/* 上线前自适应收口：反馈内容、联系方式和提示文案不横向溢出。 */
text,
button,
input,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.feedback-textarea {
  box-sizing: border-box;
}
</style>
