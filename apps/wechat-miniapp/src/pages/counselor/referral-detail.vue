<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">转介详情</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view v-if="loading" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>正在读取转介详情...</text></view>
          <view v-else-if="error" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>{{ error }}</text></view>
          <template v-else-if="referral">
            <view class="cp-status-card orange"><text class="cp-status-title">{{ statusText(referral.status) }}</text><text class="cp-status-desc">{{ statusDesc(referral.status) }}</text></view><view class="sp-card cp-section-card"><text class="cp-section-title">转介学生</text><view class="cp-compact-user"><image class="cp-avatar sm" mode="aspectFill" :src="studentAvatar" /><view><text class="cp-name">{{ referral.student?.name || "学生" }}</text><text class="cp-desc">{{ studentMeta(referral.student) }}</text></view></view></view><view class="sp-card cp-section-card"><text class="cp-section-title">转介说明</text><view class="cp-info-list"><view class="cp-info-row"><text>发起人</text><text>{{ referral.sourceCounselor?.name || "待确认" }}</text></view><view class="cp-info-row"><text>接收人</text><text>{{ referral.targetCounselor?.name || "待确认" }}</text></view><view class="cp-info-row"><text>转介原因</text><text>{{ referral.reason || "暂无说明" }}</text></view><view v-if="referral.handledNote" class="cp-info-row"><text>处理备注</text><text>{{ referral.handledNote }}</text></view></view></view><view class="sp-card cp-section-card"><text class="cp-section-title">流转记录</text><view class="cp-timeline small"><view class="cp-time-item done"><text class="cp-time-dot"></text><view><text class="cp-name">发起转介</text><text class="cp-desc">{{ formatDateTime(referral.createdAt) }}</text></view></view><view class="cp-time-item active"><text class="cp-time-dot"></text><view><text class="cp-name">{{ flowText(referral.status) }}</text><text class="cp-desc">{{ referral.handledAt ? formatDateTime(referral.handledAt) : "系统已通知接收咨询师" }}</text></view></view></view></view>
          </template>
        </view></scroll-view></view>
    <view v-if="canHandle" class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting" @click="acceptReferral">接收转介</button><button class="sp-secondary" :disabled="submitting" @click="rejectReferral">暂不接收</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { getUser, resolveApiAssetUrl } from "../../api/client";
import { acceptCounselorReferral, getCounselorReferral, rejectCounselorReferral } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const referralId = ref("");
const referral = ref(null);
const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const currentUser = computed(() => getUser() || {});
const canHandle = computed(() => referral.value?.status === "pending" && referral.value?.targetCounselorId === currentUser.value.id);
const studentAvatar = computed(() => resolveApiAssetUrl(referral.value?.student?.avatar) || BRAND_ASSETS.defaultStudentAvatar);

onLoad((query = {}) => {
  referralId.value = query.id || "";
});

onShow(() => {
  loadReferral();
});

async function loadReferral() {
  if (!referralId.value) {
    error.value = "缺少转介记录";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    referral.value = await getCounselorReferral(referralId.value);
  } catch (err) {
    error.value = err.message || "转介详情读取失败";
  } finally {
    loading.value = false;
  }
}

async function acceptReferral() {
  submitting.value = true;
  try {
    await acceptCounselorReferral(referralId.value);
    uni.showToast({ title: "已接收转介", icon: "success" });
    await loadReferral();
  } catch (err) {
    toast(err.message || "接收失败");
  } finally {
    submitting.value = false;
  }
}

function rejectReferral() {
  uni.showModal({
    title: "拒绝转介",
    content: "确认暂不接收该转介申请吗？",
    success: async (result) => {
      if (!result.confirm) return;
      submitting.value = true;
      try {
        await rejectCounselorReferral(referralId.value, { reason: "当前咨询安排暂无法接收" });
        uni.showToast({ title: "已拒绝转介", icon: "success" });
        await loadReferral();
      } catch (err) {
        toast(err.message || "拒绝失败");
      } finally {
        submitting.value = false;
      }
    }
  });
}

function statusText(status) {
  const map = { pending: "等待接收", accepted: "已接收", rejected: "已拒绝", approved: "管理员已通过", closed: "已关闭" };
  return map[status] || "转介处理中";
}

function statusDesc(status) {
  if (status === "pending") return "接收咨询师确认后，将同步更新转介状态";
  if (status === "accepted") return "接收咨询师已确认接收";
  if (status === "rejected") return "接收咨询师已拒绝本次转介";
  return "转介状态已更新";
}

function flowText(status) {
  if (status === "pending") return "等待接收";
  return statusText(status);
}

function avatarText(name = "") {
  return name ? name.slice(0, 1) : "学";
}

function studentMeta(student = {}) {
  return [student.college, student.grade, student.major].filter(Boolean).join(" · ") || "学生信息待完善";
}

function formatDateTime(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待确认";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function go(url) { goPage(url); }
function back() { safeBackCounselor("/pages/counselor/referrals"); }
function toast(title) { uni.showToast({ title, icon: 'none' }); }
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.cp-status-title,
.cp-status-desc,
.cp-section-title,
.cp-name,
.cp-desc,
.cp-info-row text,
.sp-primary,
.sp-secondary {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-info-row {
  align-items: flex-start;
  gap: 18rpx;
}

.cp-info-row text:last-child {
  min-width: 0;
  text-align: right;
}
</style>
