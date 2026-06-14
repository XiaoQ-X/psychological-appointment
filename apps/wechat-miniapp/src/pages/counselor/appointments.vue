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
    <view class="sp-header cp-main-header">
      <text class="cp-main-title">预约管理</text>
      <view class="cp-header-action"><view class="mini-icon more"></view></view>
    </view>
    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-with-tabbar">
          <scroll-view class="cp-tabs-scroll" scroll-x enhanced :show-scrollbar="false">
            <view class="cp-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                class="cp-tab-chip"
                :class="{ active: activeTab === tab.key }"
                @click="selectTab(tab.key)"
              >
                {{ tab.label }}
              </button>
            </view>
          </scroll-view>

          <view v-if="loading" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon calendar"></view></view>
            <text>正在读取预约...</text>
          </view>

          <view
            v-for="item in filteredAppointments"
            v-else-if="filteredAppointments.length"
            :key="item.id"
            class="cp-appointment-card"
            @click="goDetail(item.id)"
          >
            <view class="cp-card-head">
              <view class="cp-person-row">
                <image class="cp-avatar sm" mode="aspectFill" :src="assetUrl(item.student?.avatar)" />
                <view>
                  <text class="cp-name">{{ item.student?.name || "学生" }}</text>
                  <text class="cp-desc">{{ studentMeta(item.student) }}</text>
                </view>
              </view>
              <text class="sp-tag" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
            </view>
            <view class="cp-meta-list">
              <view class="cp-meta-row">
                <text class="cp-meta-icon">时</text>
                <text>{{ formatDateTimeRange(item.schedule) }}</text>
              </view>
              <view class="cp-meta-row">
                <text class="cp-meta-icon">咨</text>
                <text>{{ item.type || "心理咨询" }}{{ item.room?.name ? ` · ${item.room.name}` : "" }}</text>
              </view>
            </view>
            <view class="cp-action-row">
              <button v-if="item.status === 'pending'" class="cp-btn muted" :disabled="isBusy(item.id)" @click.stop="reject(item)">
                拒绝
              </button>
              <button v-if="item.status === 'pending'" class="cp-btn primary" :disabled="isBusy(item.id)" @click.stop="confirm(item)">
                确认预约
              </button>
              <button v-if="item.status === 'confirmed'" class="cp-btn primary" :disabled="isBusy(item.id)" @click.stop="checkin(item)">
                签到/开始
              </button>
              <button v-if="item.status === 'in_progress'" class="cp-btn primary" :disabled="isBusy(item.id)" @click.stop="complete(item)">
                完成咨询
              </button>
              <button v-if="!['pending', 'confirmed', 'in_progress'].includes(item.status)" class="cp-btn muted" @click.stop="goDetail(item.id)">
                查看详情
              </button>
            </view>
          </view>

          <view v-else class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon calendar"></view></view>
            <text>{{ emptyText }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
    <view class="sp-tabbar cp-tabbar">
      <button class="sp-tab" @click="go('/pages/counselor/dashboard')"><view class="mini-icon dashboard"></view><text>工作台</text></button>
      <button class="sp-tab active" @click="go('/pages/counselor/appointments')"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab" @click="go('/pages/counselor/students')"><view class="mini-icon students"></view><text>学生</text></button>
      <button class="sp-tab" @click="go('/pages/counselor/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  checkinAppointment,
  completeAppointment,
  confirmAppointment,
  getCounselorAppointments,
  rejectAppointment
} from "../../api/counselor";
import { resolveApiAssetUrl } from "../../api/client";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";

const tabs = [
  { key: "", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "confirmed", label: "已确认" },
  { key: "in_progress", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
  { key: "rejected", label: "已拒绝" }
];

const activeTab = ref("");
const loading = ref(false);
const actionId = ref("");
const appointments = ref([]);

const filteredAppointments = computed(() => {
  return appointments.value || [];
});

const emptyText = computed(() => {
  const current = tabs.find((item) => item.key === activeTab.value);
  return `暂无${current?.label || ""}预约`;
});

onShow(() => {
  loadAppointments();
});

function selectTab(key) {
  activeTab.value = key;
  loadAppointments();
}

async function loadAppointments() {
  loading.value = true;
  try {
    appointments.value = await getCounselorAppointments(activeTab.value ? { status: activeTab.value } : {});
  } catch (error) {
    uni.showToast({ title: error.message || "预约列表读取失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function isBusy(id) {
  return actionId.value === id;
}

async function confirm(item) {
  await runAction(item.id, () => confirmAppointment(item.id), "已确认预约");
}

function reject(item) {
  uni.showModal({
    title: "拒绝预约",
    content: "确认拒绝该学生的预约申请吗？",
    success: async (result) => {
      if (result.confirm) {
        await runAction(item.id, () => rejectAppointment(item.id, { reason: "咨询师暂无法接待该时段" }), "已拒绝预约");
      }
    }
  });
}

async function checkin(item) {
  await runAction(item.id, () => checkinAppointment(item.id), "已开始咨询");
}

async function complete(item) {
  await runAction(item.id, () => completeAppointment(item.id, { summary: "已完成本次咨询" }), "已完成咨询");
}

async function runAction(id, task, title) {
  actionId.value = id;
  try {
    await task();
    uni.showToast({ title, icon: "success" });
    await loadAppointments();
  } catch (error) {
    uni.showToast({ title: error.message || "操作失败", icon: "none" });
  } finally {
    actionId.value = "";
  }
}

function goDetail(id) {
  goPage(`/pages/counselor/appointment-detail?id=${id}`);
}

function go(url) {
  goPage(url);
}

function assetUrl(url) {
  return resolveApiAssetUrl(url) || BRAND_ASSETS.defaultStudentAvatar;
}

function studentInitial(student = {}) {
  return (student.name || "学").slice(0, 1);
}

function studentMeta(student = {}) {
  return [student.college, student.grade].filter(Boolean).join(" · ") || "学生信息待完善";
}

function statusText(status) {
  const map = {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "咨询中",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到"
  };
  return map[status] || "待处理";
}

function statusClass(status) {
  if (status === "pending") return "warning";
  if (["confirmed", "in_progress", "completed"].includes(status)) return "success";
  return "muted";
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateTimeRange(schedule) {
  if (!schedule) return "时间待确认";
  return `${formatDate(schedule.startAt)} ${formatTime(schedule.startAt)} - ${formatTime(schedule.endAt)}`;
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.fallback-avatar {
  display: grid;
  place-items: center;
  color: #fff;
  background: #4A90D9;
  font-weight: 900;
}

.cp-name,
.cp-desc,
.cp-meta-row text:last-child,
.cp-btn,
.cp-tab-chip,
.cp-empty-mini text {
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
