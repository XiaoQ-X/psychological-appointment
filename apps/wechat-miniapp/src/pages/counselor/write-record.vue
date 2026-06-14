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
      <text class="sp-header-title">填写咨询记录</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="sp-stack cp-stack cp-no-tabbar">
          <view v-if="loading || errorText" class="sp-card cp-section-card">
            <text class="cp-section-title">{{ loading ? "正在读取预约" : "无法填写记录" }}</text>
            <text class="cp-note">{{ loading ? "请稍候..." : errorText }}</text>
          </view>

          <template v-else>
            <view class="sp-card cp-section-card">
              <text class="cp-section-title">咨询对象</text>
              <view class="cp-compact-user">
                <image class="cp-avatar sm avatar-image" mode="aspectFill" :src="studentAvatar" />
                <view>
                  <text class="cp-name">{{ appointment.student?.name || "学生" }}</text>
                  <text class="cp-desc">{{ appointmentDesc }}</text>
                </view>
              </view>
            </view>

            <view class="sp-card cp-section-card">
              <text class="cp-section-title">记录内容</text>
              <view class="cp-form-grid">
                <view class="sp-field">
                  <text class="sp-label">主诉与本次摘要</text>
                  <textarea v-model="form.summary" class="sp-textarea" maxlength="1000" placeholder="记录本次咨询的核心问题与阶段性摘要" />
                </view>
                <view class="sp-field">
                  <text class="sp-label">咨询过程与干预</text>
                  <textarea v-model="form.intervention" class="sp-textarea" maxlength="1000" placeholder="记录主要干预方式、讨论重点和学生反馈" />
                </view>
                <view class="sp-field">
                  <text class="sp-label">风险观察</text>
                  <textarea v-model="form.riskNote" class="sp-textarea" maxlength="800" placeholder="如有风险信号、保护因素或转介建议，请在此记录" />
                </view>
                <view class="sp-field">
                  <text class="sp-label">跟进计划</text>
                  <textarea v-model="form.plan" class="sp-textarea" maxlength="800" placeholder="填写复访安排、作业建议或需协同事项" />
                </view>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>

    <view class="sp-bottom-actions">
      <button class="sp-primary" :disabled="saving || loading || !!errorText" :loading="saving" @click="save">
        {{ saving ? "保存中..." : "保存记录" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorAppointment, saveCounselorRecord } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { safeBackCounselor } from "@/utils/navigation";

const appointmentId = ref("");
const appointment = ref({});
const loading = ref(false);
const saving = ref(false);
const errorText = ref("");
const form = reactive({
  summary: "",
  intervention: "",
  riskNote: "",
  plan: ""
});

const studentInitial = computed(() => (appointment.value.student?.name || "学").slice(0, 1));
const studentAvatar = computed(() => resolveApiAssetUrl(appointment.value.student?.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const appointmentDesc = computed(() => {
  const schedule = appointment.value.schedule || {};
  const meta = [
    formatDateTimeRange(schedule),
    appointment.value.room?.name || appointment.value.campus?.name || "地点待确认",
    statusText(appointment.value.status)
  ].filter(Boolean);
  return meta.join(" · ");
});

onLoad((query = {}) => {
  appointmentId.value = query.id || query.appointmentId || "";
  loadAppointment();
});

async function loadAppointment() {
  if (!appointmentId.value) {
    errorText.value = "缺少预约记录，请从预约详情进入。";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    const detail = await getCounselorAppointment(appointmentId.value);
    appointment.value = detail || {};
    applyRecord(detail?.record || {});
  } catch (error) {
    errorText.value = error.message || "预约详情读取失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function applyRecord(record = {}) {
  form.summary = record.summary || appointment.value.concern || "";
  form.intervention = record.intervention || "";
  form.riskNote = record.riskNote || "";
  form.plan = record.plan || "";
}

async function save() {
  if (saving.value || loading.value || errorText.value) return;
  if (!form.summary.trim()) {
    uni.showToast({ title: "请填写主诉与本次摘要", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await saveCounselorRecord({
      appointmentId: appointmentId.value,
      summary: form.summary.trim(),
      intervention: form.intervention.trim(),
      riskNote: form.riskNote.trim(),
      plan: form.plan.trim()
    });
    uni.showToast({ title: "咨询记录已保存", icon: "success" });
    setTimeout(back, 500);
  } catch (error) {
    uni.showToast({ title: error.message || "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}

function back() {
  safeBackCounselor(appointmentId.value ? `/pages/counselor/appointment-detail?id=${appointmentId.value}` : "/pages/counselor/appointments");
}

function statusText(status) {
  return {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "咨询中",
    completed: "已完成",
    cancelled: "已取消",
    rejected: "已拒绝",
    no_show: "未到"
  }[status] || "状态待确认";
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

function formatDateTimeRange(schedule = {}) {
  if (!schedule.startAt) return "时间待确认";
  return `${formatDate(schedule.startAt)} ${formatTime(schedule.startAt)}-${formatTime(schedule.endAt)}`;
}
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 190rpx;
}

.cp-note,
.cp-name,
.cp-desc,
.sp-label,
.sp-textarea {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  color: #64748B;
  font-size: 23rpx;
  line-height: 1.6;
}

.avatar-image {
  display: block;
  background: #DBEAFE;
}

.sp-textarea {
  min-height: 188rpx;
}
</style>
