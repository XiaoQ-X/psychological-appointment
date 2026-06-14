<template>
  <view class="mobile-container sp-page messages-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header cp-main-header">
      <text class="cp-main-title">消息</text>
      <view class="header-filter">{{ activeFilterLabel }}</view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="message-stack has-tabbar">
          <view class="message-filter-row">
            <button v-for="item in filters" :key="item.key" :class="['message-filter', { active: activeFilter === item.key }]" @click="selectFilter(item.key)">
              {{ item.label }}
            </button>
          </view>

          <view v-if="loading" class="message-card">
            <view class="msg-icon gray">
              <view class="mini-icon bell"></view>
            </view>
            <view class="msg-main">
              <view class="msg-head">
                <text class="msg-title">消息加载中</text>
                <text class="msg-time">请稍候</text>
              </view>
              <text class="msg-text">正在读取你的预约、风险与转介通知。</text>
            </view>
          </view>

          <view v-else-if="error" class="message-card">
            <view class="msg-icon orange">
              <view class="mini-icon alert"></view>
            </view>
            <view class="msg-main">
              <view class="msg-head">
                <text class="msg-title">消息读取失败</text>
                <text class="msg-time">重试</text>
              </view>
              <text class="msg-text">{{ error }}</text>
            </view>
          </view>

          <view v-else-if="!messages.length" class="message-card">
            <view class="msg-icon gray">
              <view class="mini-icon bell"></view>
            </view>
            <view class="msg-main">
              <view class="msg-head">
                <text class="msg-title">暂无消息</text>
                <text class="msg-time">全部</text>
              </view>
              <text class="msg-text">新的预约、风险反馈和转介协作提醒会显示在这里。</text>
            </view>
          </view>

          <template v-else>
            <view
              v-for="message in messages"
              :key="message.id"
              class="message-card"
              :class="{ unread: !message.isRead }"
              @click="go(`/pages/counselor/message-detail?id=${message.id}`)"
            >
              <view :class="['msg-icon', message.tone]">
                <view :class="['mini-icon', message.icon]"></view>
              </view>
              <view class="msg-main">
                <view class="msg-head">
                  <text class="msg-title">{{ message.title }}</text>
                  <text class="msg-time">{{ message.time }}</text>
                </view>
                <text class="msg-text">{{ message.summary }}</text>
              </view>
              <text v-if="!message.isRead" class="unread-dot"></text>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>

    <view class="sp-tabbar cp-tabbar">
      <button class="sp-tab" @click="go('/pages/counselor/dashboard')">
        <view class="mini-icon dashboard"></view>
        <text>工作台</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/appointments')">
        <view class="mini-icon calendar"></view>
        <text>预约</text>
      </button>
      <button class="sp-tab" @click="go('/pages/counselor/students')">
        <view class="mini-icon students"></view>
        <text>学生</text>
      </button>
      <button class="sp-tab active" @click="go('/pages/counselor/profile')">
        <view class="mini-icon profile"></view>
        <text>我的</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getCounselorMessages } from "../../api/counselor";
import { goPage } from "@/utils/navigation";

const loading = ref(false);
const error = ref("");
const messages = ref([]);
const activeFilter = ref("all");

const filters = [
  { key: "all", label: "全部" },
  { key: "unread", label: "未读" },
  { key: "read", label: "已读" },
  { key: "appointment", label: "预约" },
  { key: "risk", label: "风险" },
  { key: "referral", label: "转介" }
];

const activeFilterLabel = computed(() => filters.find((item) => item.key === activeFilter.value)?.label || "全部");

onShow(() => {
  loadMessages();
});

async function loadMessages() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorMessages(messageFilterParams(activeFilter.value));
    messages.value = (Array.isArray(list) ? list : []).map(normalizeMessage);
  } catch (err) {
    error.value = err.message || "消息读取失败";
    messages.value = [];
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
    title: item.title || "消息通知",
    summary: item.content || "暂无消息内容",
    type: item.type || item.relatedType || "notice",
    relatedType: item.relatedType || "",
    relatedId: item.relatedId || "",
    isRead: Boolean(item.isRead),
    time: formatMessageTime(item.createdAt),
    tone,
    icon: iconByTone(tone, item.type || item.relatedType)
  };
}

function toneByMessage(item = {}) {
  const text = `${item.type || ""}${item.relatedType || ""}${item.title || ""}`;
  if (text.includes("risk") || text.includes("风险")) return "orange";
  if (text.includes("referral") || text.includes("转介")) return "pink";
  if (text.includes("completed") || text.includes("完成") || text.includes("通过")) return "green";
  if (text.includes("cancel") || text.includes("reject") || text.includes("取消") || text.includes("拒绝")) return "gray";
  return "blue";
}

function iconByTone(tone, type = "") {
  if (tone === "orange") return "alert";
  if (tone === "pink") return "students";
  if (tone === "green") return "check";
  if (tone === "gray") return "bell";
  return type === "appointment" ? "calendar" : "bell";
}

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "待确认";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function go(url) {
  goPage(url);
}
</script>

<style scoped>
.messages-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.header-filter {
  min-width: 78rpx;
  height: 52rpx;
  display: grid;
  place-items: center;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 800;
}

.message-stack {
  display: grid;
  gap: 2rpx;
  padding: 20rpx 0 0;
  background: #fff;
}

.message-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 0 32rpx 20rpx;
}

.message-filter {
  min-width: 92rpx;
  height: 56rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 900;
}

.message-filter.active {
  color: #fff;
  background: #4A90D9;
}

.message-stack.has-tabbar {
  padding-bottom: 150rpx;
}

.message-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  padding: 26rpx 32rpx;
  border-bottom: 1rpx solid #F3F4F6;
  background: #fff;
}

.message-card:last-child {
  border-bottom: 0;
}

.msg-icon {
  width: 72rpx;
  height: 72rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 22rpx;
}

.msg-icon .mini-icon {
  width: 38rpx;
  height: 38rpx;
}

.msg-icon.blue { color: #4A90D9; background: #DBEAFE; }
.msg-icon.orange { color: #F97316; background: #FFEDD5; }
.msg-icon.pink { color: #F472B6; background: #FCE7F3; }
.msg-icon.green { color: #16A34A; background: #DCFCE7; }
.msg-icon.gray { color: #64748B; background: #F1F5F9; }

.msg-main {
  min-width: 0;
  flex: 1;
}

.msg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.msg-title {
  color: #111827;
  font-size: 25rpx;
  font-weight: 900;
}

.msg-time {
  flex: none;
  color: #94A3B8;
  font-size: 20rpx;
}

.msg-text {
  display: block;
  margin-top: 8rpx;
  color: #64748B;
  font-size: 22rpx;
  line-height: 1.45;
}

.unread-dot {
  position: absolute;
  right: 28rpx;
  top: 24rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #EF4444;
}
</style>
