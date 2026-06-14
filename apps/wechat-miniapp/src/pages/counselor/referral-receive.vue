<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">接收转介</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view v-if="loading" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>正在读取转介申请...</text></view>
          <view v-else-if="error" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>{{ error }}</text></view>
          <template v-else-if="referral">
            <view class="cp-status-card blue"><text class="cp-status-title">{{ referral.status === "pending" ? "收到转介申请" : statusText(referral.status) }}</text><text class="cp-status-desc">请评估是否接收该学生后续咨询</text></view><view class="sp-card cp-section-card"><text class="cp-section-title">申请信息</text><view class="cp-info-list"><view class="cp-info-row"><text>学生</text><text>{{ studentName }}</text></view><view class="cp-info-row"><text>发起咨询师</text><text>{{ referral.sourceCounselor?.name || "待确认" }}</text></view><view class="cp-info-row"><text>建议方向</text><text>{{ referral.targetCounselor?.specialties?.[0] || "心理咨询" }}</text></view></view><text class="cp-note">发起说明：{{ referral.reason || "暂无转介说明" }}</text></view>
          </template>
        </view></scroll-view></view>
    <view v-if="referral?.status === 'pending'" class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting" @click="acceptReferral">接收转介</button><button class="sp-secondary" :disabled="submitting" @click="rejectReferral">暂不接收</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { acceptCounselorReferral, getCounselorReferral, rejectCounselorReferral } from "../../api/counselor";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const referralId = ref("");
const referral = ref(null);
const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const studentName = computed(() => {
  const student = referral.value?.student || {};
  return [student.name, student.college, student.grade].filter(Boolean).join(" · ") || "学生信息待确认";
});

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
    error.value = err.message || "转介申请读取失败";
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
  const map = { pending: "待接收", accepted: "已接收", rejected: "已拒绝", approved: "管理员已通过", closed: "已关闭" };
  return map[status] || "转介处理中";
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
.cp-info-row text,
.cp-note,
.sp-primary,
.sp-secondary {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  line-height: 1.65;
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
