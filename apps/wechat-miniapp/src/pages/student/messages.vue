<template>
  <view class="mobile-container messages-page">
    <status-bar />
    <page-header title="消息" show-back @back="goHome" />

    <scroll-view class="message-filter-scroll" scroll-x enhanced :show-scrollbar="false">
      <view class="message-filters">
        <button v-for="item in filters" :key="item.key" :class="['message-filter', { active: activeFilter === item.key }]" @click="selectFilter(item.key)">
          {{ item.label }}
        </button>
      </view>
    </scroll-view>

    <scroll-view class="messages-content" scroll-y enhanced :show-scrollbar="false">
      <view class="message-list">
        <view v-if="loading" class="message-row">
          <view class="message-main">
            <text class="message-title">消息加载中</text>
            <text class="message-summary">请稍候</text>
          </view>
        </view>
        <button
          v-else
          v-for="message in messages"
          :key="message.id"
          :class="['message-row', message.tone, { unread: message.unread }]"
          @click="go(`/pages/student/message-detail?id=${message.id}`)"
        >
          <view :class="['message-icon', message.tone]">
            <view :class="['mini-icon', message.icon]"></view>
          </view>
          <view class="message-main">
            <view class="message-title-line">
              <text class="message-title">{{ message.title }}</text>
              <view class="message-time-wrap">
                <text class="message-time">{{ message.time }}</text>
                <view v-if="message.unread" class="unread-dot"></view>
              </view>
            </view>
            <text class="message-summary">{{ message.summary }}</text>
          </view>
        </button>
        <view v-if="!loading && !messages.length" class="message-row">
          <view class="message-main">
            <text class="message-title">暂无消息</text>
            <text class="message-summary">新的预约、活动和系统通知会显示在这里</text>
          </view>
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
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getMessages } from "../../api/student";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const loading = ref(false);
const messages = ref([]);
const activeFilter = ref("all");

const filters = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "read", label: "已读" },
  { key: "appointment", label: "预约" },
  { key: "activity", label: "活动" },
  { key: "system", label: "系统" }
];

const tabs = [
  { key: "home", label: "首页", icon: "home", url: "/pages/student/home" },
  { key: "appointments", label: "预约", icon: "calendar", url: "/pages/student/appointments" },
  { key: "messages", label: "消息", icon: "bell", url: "/pages/student/messages" },
  { key: "profile", label: "我的", icon: "profile", url: "/pages/student/profile" }
];

onShow(() => {
  loadMessages();
});

async function loadMessages() {
  loading.value = true;
  try {
    const params = messageFilterParams(activeFilter.value);
    const list = await getMessages(params);
    messages.value = (Array.isArray(list) ? list : []).map(normalizeMessage);
  } catch (error) {
    messages.value = [];
    uni.showToast({ title: error.message || "消息加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectFilter(key) {
  activeFilter.value = key;
  loadMessages();
}

function messageFilterParams(key) {
  if (key === "unread") return { readStatus: "unread" };
  if (key === "read") return { readStatus: "read" };
  if (key === "all") return {};
  return { type: key };
}

function normalizeMessage(item = {}) {
  const tone = toneByMessage(item);
  return {
    id: item.id,
    type: item.type || item.relatedType || "notice",
    title: item.title || "消息通知",
    summary: item.content || "",
    time: formatMessageTime(item.createdAt),
    tone,
    icon: iconByTone(tone, item.type),
    unread: !item.isRead
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

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function go(url) {
  goPage(url);
}

function goTab(url) {
  if (url === "/pages/student/messages") return;
  goPrimaryPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}
</script>

<style scoped>
.messages-page {
  background: #f8fafc;
}

.message-filter-scroll {
  flex: none;
  width: 100%;
  background: #fff;
  white-space: nowrap;
}

.message-filters {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 40rpx;
}

.message-filter {
  min-width: 96rpx;
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 22rpx;
  font-weight: 800;
}

.message-filter.active {
  color: #fff;
  background: #4A90D9;
}

.messages-content {
  flex: 1;
  min-height: 0;
  padding-bottom: 160rpx;
  background: #fff;
}

.message-list {
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.message-row {
  width: 100%;
  min-height: 144rpx;
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  padding: 32rpx 40rpx;
  border-bottom: 1rpx solid #f3f4f6;
  border-radius: 0;
  background: #fff;
  text-align: left;
}

.message-row.blue.unread { background: rgba(239, 246, 255, .7); }
.message-row.red.unread { background: rgba(254, 242, 242, .72); }
.message-row.orange.unread { background: rgba(255, 247, 237, .72); }
.message-row.purple.unread { background: rgba(245, 243, 255, .72); }

.message-icon {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.message-icon .mini-icon {
  width: 42rpx;
  height: 42rpx;
}

.message-icon.blue { color: #3b82f6; background: #dbeafe; }
.message-icon.red { color: #ef4444; background: #fee2e2; }
.message-icon.orange { color: #f97316; background: #ffedd5; }
.message-icon.purple { color: #8b5cf6; background: #ede9fe; }
.message-icon.green { color: #22c55e; background: #dcfce7; }

.message-main {
  flex: 1;
  min-width: 0;
}

.message-title-line,
.message-time-wrap {
  display: flex;
  align-items: center;
}

.message-title-line {
  justify-content: space-between;
  gap: 16rpx;
}

.message-title {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.message-time-wrap {
  gap: 12rpx;
  flex: none;
}

.message-time {
  color: #9ca3af;
  font-size: 20rpx;
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 999rpx;
  background: #ef4444;
}

.message-summary {
  display: block;
  margin-top: 8rpx;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
/* 上线前自适应收口：消息标题、摘要和时间不横向溢出。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
