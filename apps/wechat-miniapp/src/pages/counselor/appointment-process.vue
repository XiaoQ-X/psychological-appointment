<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">预约处理</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-no-tabbar">
          <view v-if="errorText" class="sp-card cp-section-card error-card">
            <text class="cp-section-title">{{ errorText }}</text>
            <button class="error-return-btn" @click="back">返回</button>
          </view>

          <view class="sp-card cp-section-card">
            <text class="cp-section-title">预约申请</text>
            <view class="cp-compact-user">
              <image class="cp-avatar sm" mode="aspectFill" :src="studentAvatar" />
              <view>
                <text class="cp-name">{{ appointment.student?.name || "学生" }}</text>
                <text class="cp-desc">{{ formatDateTimeRange(appointment.schedule) }} · {{ appointment.type || "心理咨询" }}</text>
              </view>
            </view>
            <text class="cp-note">学生申请原因：{{ appointment.concern || "学生暂未填写详细原因。" }}</text>
          </view>

          <view class="sp-card cp-section-card">
            <text class="cp-section-title">处理方式</text>
            <view class="cp-option-grid">
              <button
                v-for="item in availableActions"
                :key="item.key"
                class="cp-option"
                :class="{ active: actionType === item.key }"
                @click="actionType = item.key"
              >
                {{ item.label }}
              </button>
            </view>
          </view>

          <view class="sp-card cp-section-card">
            <text class="cp-section-title">咨询地点</text>
            <view class="cp-option-grid two">
              <button class="cp-option active">{{ appointment.room?.name || "咨询室待分配" }}</button>
              <button class="cp-option">{{ appointment.room ? "线下咨询" : "方式待确认" }}</button>
            </view>
            <view class="sp-field">
              <text class="sp-label">处理备注</text>
              <textarea class="sp-textarea" v-model="remark" placeholder="请输入处理说明" />
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
    <view class="sp-bottom-actions"><button class="sp-primary" :disabled="submitting || !actionType || !!errorText" @click="submitProcess">{{ submitting ? "提交中..." : "提交处理" }}</button></view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  checkinAppointment,
  completeAppointment,
  confirmAppointment,
  getCounselorAppointment,
  rejectAppointment
} from "../../api/counselor";
import { resolveApiAssetUrl } from "../../api/client";
import { BRAND_ASSETS } from "@/utils/brand";
import { replacePage, safeBackCounselor } from "@/utils/navigation";

const appointmentId = ref("");
const errorText = ref("");
const appointment = ref({});
const actionType = ref("");
const remark = ref("");
const submitting = ref(false);

const studentInitial = computed(() => (appointment.value.student?.name || "学").slice(0, 1));
const studentAvatar = computed(() => resolveApiAssetUrl(appointment.value.student?.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const availableActions = computed(() => {
  const status = appointment.value.status;
  if (status === "pending") return [{ key: "confirm", label: "确认预约" }, { key: "reject", label: "拒绝预约" }];
  if (status === "confirmed") return [{ key: "checkin", label: "签到/开始咨询" }];
  if (status === "in_progress") return [{ key: "complete", label: "完成咨询" }];
  return [{ key: "view", label: "查看详情" }];
});

onLoad((query) => {
  appointmentId.value = query?.id || "";
  loadDetail();
});

async function loadDetail() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请返回预约列表重新进入。";
    uni.showToast({ title: "缺少预约ID", icon: "none" });
    return;
  }
  try {
    errorText.value = "";
    appointment.value = await getCounselorAppointment(appointmentId.value);
    actionType.value = availableActions.value[0]?.key || "";
    remark.value = defaultRemark(actionType.value);
  } catch (error) {
    errorText.value = error.message || "预约详情读取失败";
    uni.showToast({ title: error.message || "预约详情读取失败", icon: "none" });
  }
}

async function submitProcess() {
  if (!actionType.value) return;
  if (actionType.value === "view") {
    replacePage(`/pages/counselor/appointment-detail?id=${appointmentId.value}`);
    return;
  }
  submitting.value = true;
  try {
    if (actionType.value === "confirm") {
      await confirmAppointment(appointmentId.value);
    } else if (actionType.value === "reject") {
      await rejectAppointment(appointmentId.value, { reason: remark.value || "咨询师暂无法接待该时段" });
    } else if (actionType.value === "checkin") {
      await checkinAppointment(appointmentId.value);
    } else if (actionType.value === "complete") {
      await completeAppointment(appointmentId.value, { summary: remark.value || "已完成本次咨询" });
    }
    uni.showToast({ title: "处理结果已保存", icon: "success" });
    setTimeout(() => {
      replacePage(`/pages/counselor/appointment-detail?id=${appointmentId.value}`);
    }, 500);
  } catch (error) {
    uni.showToast({ title: error.message || "提交失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function defaultRemark(type) {
  if (type === "confirm") return "已确认本次咨询，请学生按时到达咨询室。";
  if (type === "reject") return "咨询师暂无法接待该时段。";
  if (type === "checkin") return "学生已签到，咨询开始。";
  if (type === "complete") return "已完成本次咨询。";
  return "";
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

function back() {
  safeBackCounselor(appointmentId.value ? `/pages/counselor/appointment-detail?id=${appointmentId.value}` : "/pages/counselor/appointments");
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.cp-section-title,
.cp-name,
.cp-desc,
.cp-note,
.cp-option,
.sp-label,
.sp-textarea {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  line-height: 1.65;
}

.error-card {
  border-color: #FECACA;
  color: #B91C1C;
  background: #FEF2F2;
}

.error-return-btn {
  width: 100%;
  min-height: 76rpx;
  border-radius: 20rpx;
  color: #4A90D9;
  background: #fff;
  font-size: 24rpx;
  font-weight: 900;
}

.sp-textarea {
  min-height: 180rpx;
}
</style>
