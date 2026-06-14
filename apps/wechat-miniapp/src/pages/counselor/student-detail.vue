<template>
  <view class="mobile-container sp-page student-detail-page">
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
      <text class="sp-header-title">学生档案</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="profile-wrap">
          <view class="profile-top">
            <image class="photo-avatar photo-avatar-image" mode="aspectFill" :src="studentAvatar" />
            <text class="profile-name">{{ student.name || "学生档案" }}</text>
            <text class="profile-desc">{{ studentProfileDesc }}</text>
            <view class="status-tags">
              <text :class="['tag', riskTagClass(latestRisk?.level)]">{{ riskText(latestRisk?.level) }}</text>
              <text class="tag blue">{{ appointmentSummary }}</text>
            </view>
          </view>

          <view class="profile-tabs">
            <button class="active" disabled>基本信息</button>
            <button disabled>咨询记录</button>
            <button disabled>评估记录</button>
            <button disabled>转介历史</button>
          </view>

          <view class="proto-card info-card muted-card">
            <text class="card-title">档案子栏目说明</text>
            <text class="summary-text">咨询记录、评估记录和转介历史已在当前档案摘要中整合展示，可从最近预约继续填写咨询记录。</text>
          </view>

          <view v-if="loading" class="proto-card info-card">
            <text class="card-title">正在读取学生档案...</text>
          </view>

          <view v-else-if="errorText" class="proto-card info-card">
            <text class="card-title">{{ errorText }}</text>
          </view>

          <view v-else class="proto-card info-card">
            <text class="card-title">个人信息</text>
            <view class="info-row">
              <text>学号</text>
              <text>{{ student.studentNo || "未填写" }}</text>
            </view>
            <view class="info-row">
              <text>学院专业</text>
              <text>{{ collegeMajor }}</text>
            </view>
            <view class="info-row">
              <text>联系电话</text>
              <text>{{ maskPhone(student.phone) }}</text>
            </view>
            <view class="info-row">
              <text>所在校区</text>
              <text>{{ student.campus?.name || "未填写" }}</text>
            </view>
          </view>

          <view class="proto-card info-card">
            <text class="card-title">最近预约</text>
            <view class="contact-box">
              <view class="contact-icon">{{ latestAppointmentInitial }}</view>
              <view>
                <text class="contact-name">{{ latestAppointmentTitle }}</text>
                <text class="contact-phone">{{ latestAppointmentDesc }}</text>
              </view>
            </view>
          </view>

          <view class="proto-card summary-card">
            <view class="section-row">
              <text class="card-title">风险与测评摘要</text>
              <text class="date-text">{{ formatShortDate(latestRisk?.createdAt) }}</text>
            </view>
            <text class="summary-text">{{ riskSummary }}</text>
            <view class="score-row">
              <view>
                <text class="score-num">{{ appointmentCount }}</text>
                <text class="score-label">咨询次数</text>
              </view>
              <view>
                <text class="score-num orange">{{ latestRisk?.score ?? "--" }}</text>
                <text class="score-label">{{ latestRisk?.source || "风险筛查" }}</text>
              </view>
              <view>
                <text class="score-num green">{{ processText(latestRisk?.processStatus) }}</text>
                <text class="score-label">当前状态</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="!errorText" class="fixed-actions">
      <button class="secondary-btn" @click="go(`/pages/counselor/referral-create?studentId=${studentId}`)">发起转介</button>
      <button class="primary-btn" :class="{ disabled: !latestAppointment?.id }" :disabled="!latestAppointment?.id" @click="goRecord">
        {{ latestAppointment?.id ? "填写记录" : "暂无记录" }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorStudent } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage, safeBackCounselor } from "@/utils/navigation";

const studentId = ref("");
const student = ref({});
const loading = ref(false);
const errorText = ref("");

const latestRisk = computed(() => {
  const list = Array.isArray(student.value.riskAssessments) ? student.value.riskAssessments : [];
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
});

const latestAppointment = computed(() => {
  const list = Array.isArray(student.value.appointments) ? student.value.appointments : [];
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
});

const studentInitial = computed(() => (student.value.name || "学").slice(0, 1));
const studentAvatar = computed(() => resolveApiAssetUrl(student.value.avatar) || BRAND_ASSETS.defaultStudentAvatar);
const studentProfileDesc = computed(() => [student.value.college, student.value.grade, student.value.gender].filter(Boolean).join(" · ") || "学生信息待完善");
const collegeMajor = computed(() => [student.value.college, student.value.major].filter(Boolean).join(" · ") || "未填写");
const appointmentCount = computed(() => Array.isArray(student.value.appointments) ? student.value.appointments.length : 0);
const appointmentSummary = computed(() => appointmentCount.value ? `累计咨询 ${appointmentCount.value} 次` : "暂无咨询记录");
const latestAppointmentInitial = computed(() => latestAppointment.value ? "约" : "无");
const latestAppointmentTitle = computed(() => latestAppointment.value ? statusText(latestAppointment.value.status) : "暂无预约记录");
const latestAppointmentDesc = computed(() => latestAppointment.value ? `${formatDateTimeRange(latestAppointment.value.schedule)} · ${latestAppointment.value.room?.name || latestAppointment.value.campus?.name || "地点待确认"}` : "学生与当前咨询师暂无预约记录");
const riskSummary = computed(() => {
  if (!latestRisk.value) return "暂无风险筛查记录。学生提交风险筛查后，会在这里显示分数、等级和处理状态。";
  return `${latestRisk.value.source || "风险筛查"} 得分 ${latestRisk.value.score} 分，等级为${riskText(latestRisk.value.level)}，处理状态：${processText(latestRisk.value.processStatus)}。`;
});
onLoad((query = {}) => {
  studentId.value = query.id || "";
  loadStudent();
});

async function loadStudent() {
  if (!studentId.value) {
    errorText.value = "缺少学生ID";
    return;
  }
  loading.value = true;
  errorText.value = "";
  try {
    student.value = await getCounselorStudent(studentId.value);
  } catch (error) {
    student.value = {};
    errorText.value = error.message || "学生档案读取失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function go(url) {
  goPage(url);
}

function back() {
  safeBackCounselor("/pages/counselor/students");
}

function goRecord() {
  if (!latestAppointment.value?.id) return;
  goPage(`/pages/counselor/write-record?id=${latestAppointment.value.id}`);
}

function maskPhone(value) {
  if (!value) return "未填写";
  return value.replace(/^(\d{3})\d{4}(\d+)/, "$1****$2");
}

function riskText(level) {
  return { crisis: "危机风险", high: "高风险", medium: "中风险", low: "低风险" }[level] || "待评估";
}

function riskTagClass(level) {
  if (["crisis", "high"].includes(level)) return "danger";
  if (level === "medium") return "danger";
  if (level === "low") return "";
  return "blue";
}

function processText(status) {
  return { open: "待处理", following: "跟进中", handled: "已处理", closed: "已关闭" }[status] || "待评估";
}

function statusText(status) {
  return {
    pending: "待确认预约",
    confirmed: "已确认预约",
    in_progress: "咨询进行中",
    completed: "咨询已完成",
    cancelled: "预约已取消",
    rejected: "预约已拒绝",
    no_show: "学生未到"
  }[status] || "预约记录";
}

function formatShortDate(value) {
  if (!value) return "暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "暂无";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
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
  return `${formatDate(schedule.startAt)} ${formatTime(schedule.startAt)}-${formatTime(schedule.endAt)}`;
}
</script>

<style scoped>
.student-detail-page {
  background: #EEF6FF;
  overflow-x: hidden;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.profile-wrap {
  display: grid;
  gap: 24rpx;
  padding: 28rpx 32rpx 180rpx;
}

.profile-top {
  display: grid;
  justify-items: center;
  gap: 10rpx;
  padding: 20rpx 0 8rpx;
}

.photo-avatar {
  width: 138rpx;
  height: 138rpx;
  display: grid;
  place-items: center;
  border: 6rpx solid #fff;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, #60A5FA, #4A90D9);
  box-shadow: 0 12rpx 28rpx rgba(74,144,217,.18);
  font-size: 46rpx;
  font-weight: 900;
}

.photo-avatar-image {
  display: block;
  background: #DBEAFE;
}

.profile-name {
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
}

.profile-desc {
  color: #6B7280;
  font-size: 24rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.status-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 8rpx;
}

.tag {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 800;
}

.tag.danger {
  color: #DC2626;
  background: #FEE2E2;
}

.tag.blue {
  color: #2563EB;
  background: #DBEAFE;
}

.profile-tabs {
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 4rpx 14rpx rgba(15,23,42,.04);
}

.profile-tabs button {
  min-width: 0;
  height: 82rpx;
  flex: 1;
  border-radius: 0;
  color: #94A3B8;
  background: transparent;
  font-size: 23rpx;
  font-weight: 800;
}

.profile-tabs button.active {
  color: #4A90D9;
  background: #EFF6FF;
}

.profile-tabs button[disabled] {
  opacity: 1;
}

.proto-card {
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 6rpx 18rpx rgba(37,99,235,.06);
}

.info-card,
.summary-card {
  display: grid;
  gap: 22rpx;
  padding: 30rpx;
}

.card-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 900;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid #F3F4F6;
  color: #64748B;
  font-size: 24rpx;
}

.info-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.info-row text:last-child {
  color: #1F2937;
  font-weight: 800;
  text-align: right;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.contact-box {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: #F8FAFC;
}

.contact-icon {
  width: 72rpx;
  height: 72rpx;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 50%;
  color: #fff;
  background: #F472B6;
  font-weight: 900;
}

.contact-name,
.contact-phone {
  display: block;
}

.contact-name {
  color: #111827;
  font-size: 26rpx;
  font-weight: 900;
}

.contact-phone {
  margin-top: 6rpx;
  color: #6B7280;
  font-size: 22rpx;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-text {
  color: #94A3B8;
  font-size: 22rpx;
}

.summary-text {
  color: #4B5563;
  font-size: 24rpx;
  line-height: 1.65;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.muted-card {
  background: #F8FBFF;
  border: 1rpx solid #DBEAFE;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.score-row view {
  display: grid;
  justify-items: center;
  gap: 6rpx;
  padding: 20rpx 8rpx;
  border-radius: 18rpx;
  background: #F8FAFC;
}

.score-num {
  color: #4A90D9;
  font-size: 28rpx;
  font-weight: 900;
}

.score-num.orange {
  color: #F97316;
}

.score-num.green {
  color: #16A34A;
  font-size: 24rpx;
}

.score-label {
  color: #94A3B8;
  font-size: 20rpx;
}

.fixed-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 20rpx;
  padding: 22rpx 32rpx 34rpx;
  border-top: 1rpx solid #E5E7EB;
  background: rgba(255,255,255,.96);
}

.primary-btn,
.secondary-btn {
  height: 86rpx;
  flex: 1;
  border-radius: 22rpx;
  font-size: 27rpx;
  font-weight: 900;
}

.primary-btn {
  color: #fff;
  background: #4A90D9;
}

.primary-btn.disabled {
  background: #CBD5E1;
}

.secondary-btn {
  color: #4A90D9;
  background: #EFF6FF;
}
</style>
