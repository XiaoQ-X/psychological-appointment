<template>
  <view class="mobile-container sp-page referrals-page">
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
      <text class="sp-header-title">转介协作</text>
      <button class="add-btn" @click="go('/pages/counselor/referral-create')">+</button>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="referral-stack">
          <view class="seg-tabs">
            <button v-for="tab in tabs" :key="tab.key" class="seg-tab" :class="{ active: activeTab === tab.key }" @click="selectTab(tab.key)">{{ tab.label }}</button>
          </view>

          <view class="list-top">
            <text>共{{ filteredReferrals.length }}条转介记录</text>
            <button class="list-action" @click="go('/pages/counselor/referral-create')">发起新转介</button>
          </view>

          <view v-if="loading" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon students"></view></view>
            <text>正在读取转介记录...</text>
          </view>

          <view v-else-if="error" class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon students"></view></view>
            <text>{{ error }}</text>
          </view>

          <template v-else-if="filteredReferrals.length">
            <view v-for="item in filteredReferrals" :key="item.id" class="referral-card" :class="{ receive: isReceivedPending(item) }" @click="goDetail(item.id)">
              <view class="card-head">
                <view>
                  <text class="card-title">{{ item.student?.name || "学生" }} · 转介申请</text>
                  <text class="card-meta">{{ referralMeta(item) }}</text>
                </view>
                <text class="status-chip" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
              </view>
              <text class="reason-box">转介原因：{{ item.reason || "暂无转介说明" }}</text>
              <view class="flow-row">
                <text class="flow-dot active"></text>
                <text>已提交</text>
                <text class="flow-line"></text>
                <text class="flow-dot" :class="{ active: item.status !== 'pending' }"></text>
                <text>{{ flowText(item.status) }}</text>
              </view>
              <view class="card-actions">
                <button v-if="isReceivedPending(item)" class="referral-action primary-btn" :loading="isBusy(item.id)" :disabled="isBusy(item.id)" @click.stop="acceptReferral(item)">接收转介</button>
                <button v-if="isReceivedPending(item)" class="referral-action ghost-btn" :disabled="isBusy(item.id)" @click.stop="rejectReferral(item)">暂不接收</button>
                <button v-else class="referral-action ghost-btn" @click.stop="goDetail(item.id)">查看详情</button>
              </view>
            </view>
          </template>

          <view v-else class="cp-empty-mini">
            <view class="cp-empty-icon"><view class="mini-icon students"></view></view>
            <text>暂无转介记录</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getUser } from "../../api/client";
import { acceptCounselorReferral, getCounselorReferrals, rejectCounselorReferral } from "../../api/counselor";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const tabs = [
  { key: "sent", label: "我发起的" },
  { key: "received", label: "我收到的" },
  { key: "pending", label: "待我处理" }
];

const activeTab = ref("sent");
const loading = ref(false);
const error = ref("");
const referrals = ref([]);
const actionId = ref("");
const currentUser = computed(() => getUser() || {});

const filteredReferrals = computed(() => {
  return referrals.value;
});

onShow(() => {
  loadReferrals();
});

async function loadReferrals() {
  loading.value = true;
  error.value = "";
  try {
    const list = await getCounselorReferrals({ scope: activeTab.value });
    referrals.value = Array.isArray(list) ? list : [];
  } catch (err) {
    error.value = err.message || "转介列表读取失败";
  } finally {
    loading.value = false;
  }
}

function selectTab(key) {
  activeTab.value = key;
  loadReferrals();
}

function goDetail(id) {
  go(`/pages/counselor/referral-detail?id=${id}`);
}

async function acceptReferral(item) {
  actionId.value = item.id;
  try {
    await acceptCounselorReferral(item.id);
    uni.showToast({ title: "已接收转介", icon: "success" });
    await loadReferrals();
  } catch (err) {
    toast(err.message || "接收失败");
  } finally {
    actionId.value = "";
  }
}

function rejectReferral(item) {
  uni.showModal({
    title: "拒绝转介",
    content: "确认暂不接收该转介申请吗？",
    success: async (result) => {
      if (!result.confirm) return;
      actionId.value = item.id;
      try {
        await rejectCounselorReferral(item.id, { reason: "当前咨询安排暂无法接收" });
        uni.showToast({ title: "已拒绝转介", icon: "success" });
        await loadReferrals();
      } catch (err) {
        toast(err.message || "拒绝失败");
      } finally {
        actionId.value = "";
      }
    }
  });
}

function isBusy(id) {
  return actionId.value === id;
}

function isReceivedPending(item) {
  return item.targetCounselorId === currentUser.value.id && item.status === "pending";
}

function referralMeta(item) {
  if (item.sourceCounselorId === currentUser.value.id) {
    return `接收老师：${item.targetCounselor?.name || "待确认"} · ${formatDate(item.createdAt)}`;
  }
  return `发起老师：${item.sourceCounselor?.name || "待确认"} · ${formatDate(item.createdAt)}`;
}

function statusText(status) {
  const map = { pending: "待接收", accepted: "已接收", rejected: "已拒绝", approved: "已通过", closed: "已关闭" };
  return map[status] || "待处理";
}

function statusClass(status) {
  if (status === "pending") return "warning";
  if (["accepted", "approved", "closed"].includes(status)) return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

function flowText(status) {
  if (status === "pending") return "待接收";
  return statusText(status);
}

function formatDate(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function go(url) {
  goPage(url);
}

function back() {
  safeBackCounselor("/pages/counselor/dashboard");
}

function toast(title) {
  uni.showToast({ title, icon: "none" });
}
</script>

<style scoped>
.referrals-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.add-btn {
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  color: #fff;
  background: #4A90D9;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 58rpx;
}

.referral-stack {
  display: grid;
  gap: 22rpx;
  padding: 24rpx 32rpx 40rpx;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.seg-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 4rpx 14rpx rgba(15,23,42,.04);
}

.seg-tab {
  min-width: 0 !important;
  width: auto !important;
  height: 76rpx;
  border-radius: 0;
  color: #94A3B8;
  background: transparent;
  font-size: 23rpx;
  font-weight: 800;
}

.seg-tab.active {
  color: #fff;
  background: #4A90D9;
}

.list-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #64748B;
  font-size: 23rpx;
}

.list-action {
  min-width: 0 !important;
  width: 180rpx;
  height: 58rpx;
  border-radius: 999rpx;
  color: #4A90D9;
  background: #EFF6FF;
  font-size: 22rpx;
  font-weight: 900;
}

.referral-card {
  width: 100%;
  box-sizing: border-box;
  display: grid;
  gap: 18rpx;
  padding: 28rpx;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37,99,235,.06);
}

.referral-card.receive {
  border: 1rpx solid #FEE2E2;
}

.card-head,
.card-actions,
.flow-row {
  display: flex;
  align-items: center;
}

.card-head {
  justify-content: space-between;
  gap: 18rpx;
}

.card-title,
.card-meta {
  display: block;
}

.card-title {
  color: #111827;
  font-size: 27rpx;
  font-weight: 900;
}

.card-meta {
  margin-top: 8rpx;
  color: #94A3B8;
  font-size: 21rpx;
}

.status-chip {
  flex: none;
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 900;
}

.status-chip.warning { color: #EA580C; background: #FFEDD5; }
.status-chip.success { color: #16A34A; background: #DCFCE7; }
.status-chip.danger { color: #DC2626; background: #FEE2E2; }

.reason-box {
  padding: 20rpx;
  border-radius: 18rpx;
  color: #64748B;
  background: #F8FAFC;
  font-size: 23rpx;
  line-height: 1.55;
}

.flow-row {
  gap: 10rpx;
  color: #94A3B8;
  font-size: 21rpx;
}

.flow-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #CBD5E1;
}

.flow-dot.active {
  background: #4A90D9;
}

.flow-line {
  width: 48rpx;
  height: 2rpx;
  background: #E5E7EB;
}

.card-actions {
  gap: 18rpx;
}

.referral-action,
.primary-btn,
.ghost-btn {
  height: 72rpx;
  flex: 1;
  min-width: 0 !important;
  border-radius: 18rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.primary-btn {
  color: #fff;
  background: #4A90D9;
}

.ghost-btn {
  color: #4A90D9;
  background: #EFF6FF;
}
</style>
