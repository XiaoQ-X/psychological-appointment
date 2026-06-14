<template>
  <view class="mobile-container sp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header">
      <button class="sp-back" @click="back">
        <view class="mini-icon chevron-left"></view>
      </button>
      <text class="sp-header-title">咨询评价</text>
      <view class="sp-header-spacer"></view>
    </view>

    <scroll-view class="sp-content" scroll-y enhanced :show-scrollbar="false">
      <view v-if="submitted" class="sp-success-wrap">
        <view class="sp-success-icon pink">♥</view>
        <text class="sp-success-title">感谢你的评价！</text>
        <text class="sp-success-desc">你的反馈将帮助我们持续提升咨询服务质量</text>
        <button class="sp-primary sp-success-btn" @click="goAppointments">返回我的预约</button>
      </view>

      <view v-else class="sp-stack feedback-form">
        <view v-if="errorText" class="sp-card form-error-card">
          <text>{{ errorText }}</text>
          <button @click="goAppointments">返回我的预约</button>
        </view>

        <view class="sp-card feedback-counselor">
          <view class="feedback-avatar"><view class="mini-icon profile"></view></view>
          <text class="sp-title">{{ target.counselorName }} 老师</text>
          <text class="sp-muted">{{ target.time }}</text>
          <text class="sp-muted">{{ target.typeText }} · {{ target.place }}</text>
        </view>

        <view class="sp-card">
          <text class="feedback-title">满意度评分</text>
          <view class="feedback-stars">
            <button
              v-for="star in 5"
              :key="star"
              :class="['feedback-star', star <= rating ? 'active' : '']"
              @click="rating = star"
            >
              {{ star <= rating ? "★" : "☆" }}
            </button>
          </view>
          <text class="feedback-hint">{{ rating ? `${rating} 星` : "点击星星进行评分" }}</text>
        </view>

        <view class="sp-card">
          <text class="sp-title">咨询体验评分</text>
          <view class="feedback-experience-grid">
            <button
              v-for="item in experiences"
              :key="item"
              :class="['feedback-experience', item === experience ? 'active' : '']"
              @click="experience = item"
            >
              {{ item }}
            </button>
          </view>
        </view>

        <view class="sp-card">
          <text class="sp-title">是否愿意再次预约该咨询师</text>
          <view class="sp-radio-row">
            <button :class="['sp-radio', again ? 'active' : '']" @click="again = true">愿意</button>
            <button :class="['sp-radio', !again ? 'active' : '']" @click="again = false">不愿意</button>
          </view>
        </view>

        <view class="sp-card">
          <text class="sp-title">评价标签（多选）</text>
          <view class="feedback-tags">
            <button
              v-for="tag in tags"
              :key="tag"
              :class="['feedback-tag', selectedTags.includes(tag) ? 'active' : '']"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </view>
        </view>

        <view class="sp-card">
          <text class="sp-title">文字评价（选填）</text>
          <textarea v-model="content" class="sp-textarea feedback-textarea" placeholder="分享你的咨询体验..." />
        </view>

        <view class="sp-bottom-actions inline">
          <button class="sp-secondary" @click="back">取消</button>
          <button class="sp-primary" :loading="submitting" :disabled="submitting || !!errorText" @click="submitFeedback">提交评价</button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getAppointmentDetail, submitAppointmentFeedback } from "../../api/student";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";

const appointmentId = ref("");
const errorText = ref("");
const submitted = ref(false);
const submitting = ref(false);
const rating = ref(0);
const experience = ref("");
const again = ref(false);
const selectedTags = ref([]);
const content = ref("");
const appointment = ref(null);

const experiences = ["很差", "较差", "一般", "满意", "非常满意"];
const tags = ["专业耐心", "很有帮助", "环境舒适", "沟通流畅", "建议实用"];

const target = computed(() => {
  const item = appointment.value || {};
  return {
    counselorName: item.counselor?.name || "咨询师",
    time: formatRange(item.schedule?.startAt, item.schedule?.endAt) || "咨询时间待确认",
    typeText: item.type === "online" ? "线上咨询" : "线下咨询",
    place: item.type === "online" ? "线上视频" : (item.room?.name || item.campus?.name || "心理中心咨询室")
  };
});

onLoad((query = {}) => {
  appointmentId.value = query.id || "";
  loadFeedbackTarget();
});

async function loadFeedbackTarget() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    return;
  }
  try {
    appointment.value = await getAppointmentDetail(appointmentId.value);
  } catch (error) {
    errorText.value = error.message || "评价对象加载失败，请返回后重试。";
    uni.showToast({ title: error.message || "评价对象加载失败", icon: "none" });
  }
}

async function submitFeedback() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回我的预约重新进入。";
    uni.showToast({ title: "缺少预约记录", icon: "none" });
    return;
  }
  if (!rating.value) {
    uni.showToast({ title: "请先选择满意度评分", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    await submitAppointmentFeedback(appointmentId.value, {
      rating: rating.value,
      tags: [...selectedTags.value, experience.value, again.value ? "愿意再次预约" : "不愿意再次预约"].filter(Boolean),
      content: content.value
    });
    submitted.value = true;
  } catch (error) {
    uni.showToast({ title: error.message || "评价提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function toggleTag(tag) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((item) => item !== tag)
    : [...selectedTags.value, tag];
}

function go(url) {
  goPage(url);
}

function goAppointments() {
  goPrimaryPage("/pages/student/appointments");
}

function back() {
  safeBackStudent("/pages/student/appointments");
}

function formatRange(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime())) return "";
  const date = start.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const startText = start.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  const endText = Number.isNaN(end.getTime()) ? "" : `-${end.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  return `${date} ${startText}${endText}`;
}
</script>

<style scoped>
.feedback-form {
  padding-bottom: 40rpx;
}

.form-error-card {
  gap: 20rpx;
  border-color: #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.form-error-card button {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.feedback-counselor {
  align-items: center;
  text-align: center;
}

.feedback-avatar {
  width: 112rpx;
  height: 112rpx;
  display: grid;
  place-items: center;
  margin: 0 auto 18rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #dbeafe;
}

.feedback-avatar .mini-icon {
  width: 58rpx;
  height: 58rpx;
  color: #4A90D9;
}

.feedback-title {
  display: block;
  margin-bottom: 20rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 800;
  text-align: center;
}

.feedback-stars {
  display: flex;
  justify-content: center;
  gap: 14rpx;
  margin-bottom: 12rpx;
}

.feedback-star {
  width: 58rpx;
  height: 58rpx;
  display: grid;
  place-items: center;
  color: #f59e0b;
  background: transparent;
  font-size: 56rpx;
  line-height: 1;
}

.feedback-hint {
  display: block;
  color: #9ca3af;
  font-size: 22rpx;
  text-align: center;
}

.feedback-experience-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 22rpx;
}

.feedback-experience {
  min-height: 64rpx;
  display: grid;
  place-items: center;
  border: 1rpx solid #e5e7eb;
  border-radius: 16rpx;
  color: #6b7280;
  background: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.feedback-experience.active {
  color: #fff;
  border-color: #4A90D9;
  background: #4A90D9;
}

.sp-radio-row,
.feedback-tags {
  display: flex;
  align-items: center;
}

.sp-radio-row {
  gap: 24rpx;
  margin-top: 22rpx;
}

.sp-radio {
  min-width: 128rpx;
  height: 60rpx;
  display: grid;
  place-items: center;
  border: 1rpx solid #e5e7eb;
  border-radius: 999rpx;
  color: #6b7280;
  background: #fff;
  font-size: 24rpx;
  font-weight: 700;
}

.sp-radio.active {
  color: #fff;
  border-color: #4A90D9;
  background: #4A90D9;
}

.feedback-tags {
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 22rpx;
}

.feedback-tag {
  min-height: 60rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 24rpx;
  font-weight: 700;
}

.feedback-tag.active {
  color: #4A90D9;
  background: #dbeafe;
}

.feedback-textarea {
  margin-top: 22rpx;
}
/* 上线前自适应收口：评价内容和按钮在长文本下保持稳定。 */
text,
button,
textarea {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
