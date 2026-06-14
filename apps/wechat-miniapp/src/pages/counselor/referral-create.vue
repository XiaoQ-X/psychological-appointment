<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">发起转介</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view v-if="loading" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>正在读取转介信息...</text></view>
          <view v-else-if="error" class="cp-empty-mini"><view class="cp-empty-icon"><view class="mini-icon students"></view></view><text>{{ error }}</text></view>
          <view v-else-if="!counselors.length" class="sp-card cp-section-card notice-card">
            <text class="cp-section-title">暂无可转介咨询师</text>
            <text class="cp-note">当前没有可接收的其他咨询师账号。新增第二个 active 咨询师账号后，本页会自动显示可接收咨询师。</text>
          </view>
          <view class="sp-card cp-section-card"><text class="cp-section-title">转介信息</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">选择学生</text><picker :range="studentNames" :value="selectedStudentIndex" @change="selectStudent"><view class="sp-picker">{{ selectedStudentName }}</view></picker></view><view class="sp-field"><text class="sp-label">接收咨询师</text><picker :range="counselorNames" :value="selectedCounselorIndex" @change="selectCounselor"><view class="sp-picker">{{ selectedCounselorName }}</view></picker></view><view class="sp-field"><text class="sp-label">转介原因</text><textarea v-model="form.reason" class="sp-textarea" placeholder="请填写转介原因" /></view><view class="sp-field"><text class="sp-label">附加说明</text><textarea v-model="form.note" class="sp-textarea" placeholder="可补充与学生沟通情况、风险提醒等" /></view></view></view>
        </view></scroll-view></view>
    <view class="sp-bottom-actions"><button class="sp-primary" :loading="submitting" :disabled="submitting || !form.studentId || !form.targetCounselorId" @click="submit">提交转介</button></view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { createCounselorReferral, getAvailableCounselors, getCounselorStudents } from "../../api/counselor";
import { goPage, replacePage, safeBackCounselor } from "@/utils/navigation";

const loading = ref(false);
const submitting = ref(false);
const error = ref("");
const students = ref([]);
const counselors = ref([]);
const queryStudentId = ref("");
const form = reactive({
  studentId: "",
  targetCounselorId: "",
  reason: "",
  note: ""
});

const studentNames = computed(() => students.value.map((item) => `${item.name || "学生"} · ${[item.college, item.grade].filter(Boolean).join(" · ") || item.studentNo || "信息待完善"}`));
const counselorNames = computed(() => counselors.value.map((item) => `${item.name || "咨询师"} · ${item.title || item.specialties?.[0] || "心理咨询"}`));
const selectedStudentIndex = computed(() => Math.max(0, students.value.findIndex((item) => item.id === form.studentId)));
const selectedCounselorIndex = computed(() => Math.max(0, counselors.value.findIndex((item) => item.id === form.targetCounselorId)));
const selectedStudentName = computed(() => studentNames.value[selectedStudentIndex.value] || "暂无可转介学生");
const selectedCounselorName = computed(() => counselorNames.value[selectedCounselorIndex.value] || "暂无可接收咨询师");

onLoad((query = {}) => {
  queryStudentId.value = query.studentId || "";
});

onShow(() => {
  loadOptions();
});

async function loadOptions() {
  loading.value = true;
  error.value = "";
  try {
    const [studentList, counselorList] = await Promise.all([
      getCounselorStudents(),
      getAvailableCounselors()
    ]);
    students.value = Array.isArray(studentList) ? studentList : [];
    counselors.value = Array.isArray(counselorList) ? counselorList : [];
    form.studentId = queryStudentId.value && students.value.some((item) => item.id === queryStudentId.value)
      ? queryStudentId.value
      : students.value[0]?.id || "";
    form.targetCounselorId = counselors.value[0]?.id || "";
  } catch (err) {
    error.value = err.message || "转介信息读取失败";
  } finally {
    loading.value = false;
  }
}

function selectStudent(event) {
  form.studentId = students.value[Number(event.detail.value)]?.id || "";
}

function selectCounselor(event) {
  form.targetCounselorId = counselors.value[Number(event.detail.value)]?.id || "";
}

async function submit() {
  if (!form.studentId) {
    toast("请选择学生");
    return;
  }
  if (!form.targetCounselorId) {
    toast("请选择接收咨询师");
    return;
  }
  if (!form.reason.trim()) {
    toast("请填写转介原因");
    return;
  }
  submitting.value = true;
  try {
    const reason = form.note.trim() ? `${form.reason.trim()}\n附加说明：${form.note.trim()}` : form.reason.trim();
    const referral = await createCounselorReferral({
      studentId: form.studentId,
      targetCounselorId: form.targetCounselorId,
      reason
    });
    uni.showToast({ title: "转介申请已发起", icon: "success" });
    setTimeout(() => replacePage(`/pages/counselor/referral-detail?id=${referral.id}`), 700);
  } catch (err) {
    toast(err.message || "转介提交失败");
  } finally {
    submitting.value = false;
  }
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

.notice-card {
  border: 1rpx solid #DBEAFE;
  background: #F8FBFF;
}

.cp-note,
.sp-label,
.sp-picker,
.sp-textarea {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  color: #64748B;
  font-size: 23rpx;
  line-height: 1.6;
}
</style>
