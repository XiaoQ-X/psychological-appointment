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
      <text class="sp-header-title">消息详情</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-no-tabbar">
          <view class="sp-card cp-article-detail">
            <text class="cp-article-title">{{ detailTitle }}</text>
            <text class="cp-desc">{{ metaText }}</text>
            <view class="cp-divider"></view>

            <text v-if="loading" class="cp-paragraph">消息加载中，请稍候。</text>
            <text v-else-if="error" class="cp-paragraph">{{ error }}</text>
            <template v-else>
              <text v-for="paragraph in paragraphs" :key="paragraph" class="cp-paragraph">{{ paragraph }}</text>
              <view v-if="message.relatedId" class="cp-divider"></view>
              <text v-if="message.relatedType" class="cp-paragraph">关联类型：{{ relatedTypeText(message.relatedType) }}</text>
              <text v-if="message.relatedId" class="cp-paragraph">关联编号：{{ message.relatedId }}</text>
              <button v-if="relatedLink" class="cp-btn primary" @click="go(relatedLink.url)">{{ relatedLink.text }}</button>
            </template>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getCounselorMessage, markCounselorMessageRead } from "../../api/counselor";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const messageId = ref("");
const loading = ref(false);
const error = ref("");
const message = ref({});

const detailTitle = computed(() => {
  if (loading.value) return "消息加载中";
  if (error.value) return "无法打开消息";
  return message.value.title || "消息详情";
});

const metaText = computed(() => {
  if (loading.value) return "系统通知";
  const type = relatedTypeText(message.value.relatedType || message.value.type);
  return `${type} · ${formatDateTime(message.value.createdAt)}`;
});

const paragraphs = computed(() => {
  const content = String(message.value.content || "暂无消息内容");
  return content.split(/\n+/).map((item) => item.trim()).filter(Boolean);
});

const relatedLink = computed(() => {
  const relatedType = message.value.relatedType;
  const relatedId = message.value.relatedId;
  if (relatedType === "appointment" && relatedId) {
    return { text: "查看预约详情", url: `/pages/counselor/appointment-detail?id=${relatedId}` };
  }
  if (relatedType === "referral" && relatedId) {
    return { text: "查看转介详情", url: `/pages/counselor/referral-detail?id=${relatedId}` };
  }
  if (relatedType === "risk" && relatedId) {
    return { text: "查看风险记录", url: `/pages/counselor/risk-feedback?id=${relatedId}` };
  }
  return null;
});

onLoad((query) => {
  messageId.value = query?.id || "";
  loadMessage();
});

async function loadMessage() {
  if (!messageId.value) {
    error.value = "缺少消息 ID";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const detail = await getCounselorMessage(messageId.value);
    message.value = detail || {};
    await markCounselorMessageRead(messageId.value);
    message.value = { ...message.value, isRead: true };
  } catch (err) {
    error.value = err.message || "消息详情加载失败";
    uni.showToast({ title: error.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function relatedTypeText(type = "") {
  const map = {
    appointment: "预约通知",
    risk: "风险提醒",
    referral: "转介协作",
    shift: "调班通知",
    system: "系统通知",
    notice: "系统通知"
  };
  return map[type] || "系统通知";
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

function go(url) {
  goPage(url);
}

function back() {
  safeBackCounselor("/pages/counselor/messages");
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-article-title,
.cp-desc,
.cp-paragraph,
.cp-btn {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-paragraph {
  white-space: pre-wrap;
  line-height: 1.75;
}
</style>
