<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header cp-main-header"><text class="cp-main-title">学生管理</text><view class="cp-header-action"><view class="mini-icon more"></view></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-with-tabbar ">
<view class="cp-search-box"><view class="mini-icon search"></view><text>搜索姓名或学号</text></view>
<view class="cp-line-tabs">
  <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}</button>
</view>

<view v-if="loading" class="cp-empty-mini">
  <view class="cp-empty-icon"><view class="mini-icon students"></view></view>
  <text>正在读取学生档案...</text>
</view>

<view v-else-if="!filteredStudents.length" class="cp-empty-mini">
  <view class="cp-empty-icon"><view class="mini-icon students"></view></view>
  <text>{{ errorText || "暂无关联学生" }}</text>
</view>

<block v-else>
  <view v-for="item in filteredStudents" :key="item.id" class="cp-student-list-card" @click="goDetail(item.id)">
    <view class="cp-card-head">
      <view class="cp-person-row"><image class="cp-avatar sm" mode="aspectFill" :src="item.avatar" /><view><text class="cp-name lg">{{ item.name || "学生" }}</text><text class="cp-desc">{{ studentDesc(item) }}</text></view></view>
      <text :class="['sp-tag', riskTagClass(item.latestRisk?.level)]">{{ riskText(item.latestRisk?.level) }}</text>
    </view>
    <view class="cp-student-meta"><text>最近评估：{{ formatDate(item.latestRisk?.createdAt) }}</text><text></text><text>风险分数：{{ item.latestRisk?.score ?? "待评估" }}</text></view>
  </view>
</block>
        </view></scroll-view></view>
    <view class="sp-tabbar cp-tabbar">
      <button class="sp-tab " @click="go('/pages/counselor/dashboard')"><view class="mini-icon dashboard"></view><text>工作台</text></button>
      <button class="sp-tab " @click="go('/pages/counselor/appointments')"><view class="mini-icon calendar"></view><text>预约</text></button>
      <button class="sp-tab active" @click="go('/pages/counselor/students')"><view class="mini-icon students"></view><text>学生</text></button>
      <button class="sp-tab " @click="go('/pages/counselor/profile')"><view class="mini-icon profile"></view><text>我的</text></button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { resolveApiAssetUrl } from "../../api/client";
import { getCounselorStudents } from "../../api/counselor";
import { BRAND_ASSETS } from "@/utils/brand";
import { goPage } from "@/utils/navigation";

const tabs = [
  { key: "all", label: "全部" },
  { key: "following", label: "进行中" },
  { key: "unknown", label: "待评估" },
  { key: "high", label: "高风险" }
];
const activeTab = ref("all");
const loading = ref(false);
const errorText = ref("");
const students = ref([]);

const filteredStudents = computed(() => {
  const list = students.value;
  if (activeTab.value === "all") return list;
  if (activeTab.value === "unknown") return list.filter((item) => !item.latestRisk);
  if (activeTab.value === "high") return list.filter((item) => ["high", "crisis"].includes(item.latestRisk?.level));
  return list.filter((item) => item.latestRisk?.processStatus === "following");
});

onShow(() => {
  loadStudents();
});

async function loadStudents() {
  loading.value = true;
  errorText.value = "";
  try {
    const list = await getCounselorStudents();
    students.value = (Array.isArray(list) ? list : []).map((item) => ({
      ...item,
      avatar: resolveApiAssetUrl(item.avatar) || BRAND_ASSETS.defaultStudentAvatar,
      latestRisk: Array.isArray(item.riskAssessments) ? item.riskAssessments[0] : null
    }));
  } catch (error) {
    students.value = [];
    errorText.value = error.message || "学生档案读取失败";
    uni.showToast({ title: errorText.value, icon: "none" });
  } finally {
    loading.value = false;
  }
}

function studentDesc(item = {}) {
  return [item.college, item.major, item.grade].filter(Boolean).join(" · ") || item.studentNo || "学生信息待完善";
}

function studentInitial(item = {}) {
  return (item.name || "学").slice(0, 1);
}

function riskText(level) {
  return { crisis: "危机风险", high: "高风险", medium: "中风险", low: "低风险" }[level] || "待评估";
}

function riskTagClass(level) {
  if (["crisis", "high"].includes(level)) return "danger";
  if (level === "medium") return "warning";
  if (level === "low") return "success";
  return "";
}

function formatDate(value) {
  if (!value) return "无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "无";
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function goDetail(id) {
  goPage(`/pages/counselor/student-detail?id=${id}`);
}

function go(url) { goPage(url); }
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

.cp-search-box text,
.cp-line-tabs button,
.cp-name,
.cp-desc,
.cp-student-meta text,
.cp-empty-mini text {
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
