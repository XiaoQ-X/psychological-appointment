<template>
  <view class="mobile-container message-detail-page">
    <status-bar />
    <page-header title="消息详情" show-back @back="goBack" />

    <scroll-view class="message-detail-content" scroll-y enhanced :show-scrollbar="false">
      <view class="message-detail-inner">
        <view class="message-hero">
          <view :class="['message-hero-icon', current.tone]">
            <view :class="['mini-icon', current.icon]"></view>
          </view>
          <text class="message-hero-title">{{ current.title }}</text>
          <text class="message-hero-desc">{{ current.desc }}</text>
          <text v-if="current.countdown" class="message-countdown">{{ current.countdown }}</text>
        </view>

        <view class="detail-card notice-card">
          <text class="detail-card-title">{{ loading ? "消息加载中" : errorText ? "无法打开消息" : "消息内容" }}</text>
          <text v-for="paragraph in messageParagraphs" :key="paragraph" class="notice-paragraph">{{ paragraph }}</text>
          <view v-if="relatedLabel" class="notice-time">
            <text>关联事项：{{ relatedLabel }}</text>
          </view>
          <text class="notice-sign">{{ current.createdAt }}</text>
        </view>

        <view class="message-actions">
          <button v-for="action in current.actions" :key="action.text" :class="['message-action-btn', action.kind]" @click="handleAction(action)">
            {{ action.text }}
          </button>
          <button v-if="current.link" class="message-link" @click="go(current.link.url)">{{ current.link.text }}</button>
        </view>
      </view>
    </scroll-view>

    <view class="message-tabbar">
      <button v-for="item in tabs" :key="item.key" :class="['message-tab', { active: item.key === 'messages' }]" @click="goTab(item.url)">
        <view :class="['mini-icon', item.icon]"></view>
        <text>{{ item.label }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getMessageDetail, markMessageRead } from "../../api/student";
import { goPage, goPrimaryPage, safeBackStudent } from "@/utils/navigation";

const messageId = ref("");
const loading = ref(false);
const errorText = ref("");
const current = ref(defaultMessage());

const tabs = [
  { key: "home", label: "首页", icon: "home", url: "/pages/student/home" },
  { key: "appointments", label: "预约", icon: "calendar", url: "/pages/student/appointments" },
  { key: "messages", label: "消息", icon: "bell", url: "/pages/student/messages" },
  { key: "profile", label: "我的", icon: "profile", url: "/pages/student/profile" }
];

const messageParagraphs = computed(() => {
  if (loading.value) return ["请稍候"];
  if (errorText.value) return [errorText.value];
  return String(current.value.content || "暂无消息内容").split(/\n+/).map((item) => item.trim()).filter(Boolean);
});

const relatedLabel = computed(() => {
  if (!current.value.relatedId) return "";
  const map = {
    appointment: "预约记录",
    activity: "活动报名",
    risk: "风险提醒",
    system: "系统通知"
  };
  return map[current.value.relatedType] || "业务记录";
});

onLoad((query) => {
  messageId.value = query?.id || "";
  loadMessage();
});

async function loadMessage() {
  if (!messageId.value) {
    errorText.value = "缺少消息 ID";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getMessageDetail(messageId.value);
    current.value = normalizeMessage(detail);
    await markMessageRead(messageId.value);
    current.value.isRead = true;
  } catch (error) {
    errorText.value = error.message || "消息详情加载失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function defaultMessage() {
  return {
    type: "notice",
    title: "消息详情",
    desc: "消息内容加载中",
    content: "",
    tone: "green",
    icon: "bell",
    countdown: "",
    relatedType: "",
    relatedId: "",
    createdAt: "",
    isRead: false,
    actions: [{ text: "返回消息中心", kind: "primary", url: "/pages/student/messages" }],
    link: null
  };
}

function normalizeMessage(item = {}) {
  const tone = toneByMessage(item);
  return {
    ...defaultMessage(),
    type: item.type || item.relatedType || "notice",
    title: item.title || "消息详情",
    desc: item.content || "",
    content: item.content || "",
    tone,
    icon: iconByTone(tone, item.type),
    relatedType: item.relatedType || "",
    relatedId: item.relatedId || "",
    createdAt: formatDateTime(item.createdAt),
    isRead: Boolean(item.isRead),
    actions: actionsForMessage(item),
    link: linkForMessage(item)
  };
}

function toneByMessage(item = {}) {
  const text = `${item.type || ""}${item.relatedType || ""}${item.title || ""}`;
  if (text.includes("reject") || text.includes("拒绝") || text.includes("取消")) return "red";
  if (text.includes("remind") || text.includes("提醒") || text.includes("即将")) return "orange";
  if (text.includes("referral") || text.includes("转介")) return "purple";
  if (text.includes("activity") || text.includes("系统") || text.includes("通知")) return "green";
  return "blue";
}

function iconByTone(tone, type = "") {
  if (tone === "red") return "close";
  if (tone === "orange") return "clock";
  if (tone === "purple") return "transfer";
  if (tone === "green") return type === "activity" ? "calendar" : "bell";
  return "check";
}

function actionsForMessage(item = {}) {
  const actions = [{ text: "返回消息中心", kind: "primary", url: "/pages/student/messages" }];
  if (item.relatedType === "appointment" && item.relatedId) {
    actions.unshift({ text: "查看预约详情", kind: "secondary", url: `/pages/student/appointment-detail?id=${item.relatedId}` });
  }
  if (item.relatedType === "activity" && item.relatedId) {
    actions.unshift({ text: "查看活动详情", kind: "secondary", url: `/pages/student/activity-detail?id=${item.relatedId}` });
  }
  return actions;
}

function linkForMessage(item = {}) {
  if (item.relatedType === "appointment" && item.relatedId) {
    return { text: "查看预约详情 →", url: `/pages/student/appointment-detail?id=${item.relatedId}` };
  }
  if (item.relatedType === "activity" && item.relatedId) {
    return { text: "查看活动详情 →", url: `/pages/student/activity-detail?id=${item.relatedId}` };
  }
  return null;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function handleAction(action) {
  if (action.url) {
    go(action.url);
    return;
  }
  uni.showToast({ title: "已确认", icon: "none" });
}

function go(url) {
  goPage(url);
}

function goTab(url) {
  if (url === "/pages/student/messages") return;
  goPrimaryPage(url);
}

function goBack() {
  safeBackStudent("/pages/student/messages");
}
</script>

<style scoped>
.message-detail-page {
  background: #f8fafc;
}

.message-detail-content {
  flex: 1;
  min-height: 0;
  padding-bottom: 160rpx;
  background: #f8fafc;
}

.message-detail-inner {
  padding: 40rpx;
}

.message-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0 44rpx;
  text-align: center;
}

.message-hero-icon {
  width: 112rpx;
  height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
  border-radius: 999rpx;
}

.message-hero-icon .mini-icon {
  width: 72rpx;
  height: 72rpx;
}

.message-hero-icon.blue { color: #3b82f6; background: #dbeafe; }
.message-hero-icon.red { color: #ef4444; background: #fee2e2; }
.message-hero-icon.orange { color: #f97316; background: #ffedd5; }
.message-hero-icon.purple { color: #8b5cf6; background: #ede9fe; }
.message-hero-icon.green { color: #22c55e; background: #dcfce7; }

.message-hero-title {
  color: #1f2937;
  font-size: 40rpx;
  font-weight: 900;
}

.message-hero-desc {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.message-countdown {
  margin-top: 14rpx;
  color: #4A90D9;
  font-size: 60rpx;
  font-weight: 900;
}

.detail-card {
  margin-bottom: 40rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.detail-card-title {
  display: block;
  margin-bottom: 24rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 18rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.detail-row text:last-child {
  color: #374151;
  font-weight: 700;
  text-align: right;
}

.reason-row {
  display: flex;
  gap: 20rpx;
}

.reason-row .mini-icon {
  width: 44rpx;
  height: 44rpx;
  color: #ef4444;
  flex: none;
}

.reason-text {
  display: block;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.6;
}

.transfer-box {
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f9fafb;
}

.transfer-box.active {
  background: #eff6ff;
}

.transfer-label,
.transfer-name,
.reason-label,
.notice-paragraph,
.notice-sign {
  display: block;
}

.transfer-label,
.reason-label {
  color: #9ca3af;
  font-size: 22rpx;
}

.transfer-name {
  margin-top: 6rpx;
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.transfer-arrow {
  padding: 18rpx 0;
  color: #8b5cf6;
  font-size: 32rpx;
  text-align: center;
}

.reason-panel {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f9fafb;
}

.notice-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.notice-paragraph,
.notice-time text {
  color: #4b5563;
  font-size: 26rpx;
  line-height: 1.65;
}

.notice-time {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f9fafb;
}

.notice-sign {
  color: #9ca3af;
  font-size: 24rpx;
}

.message-actions {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.message-action-btn {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.message-action-btn.primary {
  color: #fff;
  background: #4A90D9;
}

.message-action-btn.secondary {
  color: #6b7280;
  border: 1rpx solid #f3f4f6;
  background: #fff;
}

.message-action-btn.danger {
  color: #ef4444;
  border: 1rpx solid #fecaca;
  background: #fff;
}

.message-link {
  color: #4A90D9;
  background: transparent;
  font-size: 24rpx;
  font-weight: 800;
}

.message-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 128rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8rpx 32rpx 16rpx;
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.message-tab {
  min-width: 112rpx;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border-radius: 16rpx;
  color: #94a3b8;
  background: transparent;
  font-size: 20rpx;
  font-weight: 700;
}

.message-tab .mini-icon {
  width: 44rpx;
  height: 44rpx;
}

.message-tab.active {
  color: #4A90D9;
}
/* 上线前自适应收口：消息正文、关联事项和按钮长文本稳定换行。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.notice-paragraph,
.notice-time text {
  white-space: pre-wrap;
}
</style>
