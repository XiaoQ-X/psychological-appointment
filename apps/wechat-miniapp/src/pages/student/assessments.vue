<template>
  <view class="mobile-container assessment-list-page">
    <status-bar />
    <page-header title="心理测评" show-back @back="goHome" />

    <view class="assessment-content-wrap">
      <scroll-view class="assessment-content" scroll-y enhanced :show-scrollbar="false">
        <view class="assessment-inner">
          <view class="assessment-intro">
            <text class="intro-title">心理测评</text>
            <text class="intro-desc">选择一份测评量表，了解你当前的心理状态。测评结果仅供心理健康服务参考，不作为诊断依据。</text>
          </view>

          <scroll-view v-if="typeFilters.length > 1" class="assessment-filter-scroll" scroll-x enhanced :show-scrollbar="false">
            <view class="assessment-filter-row">
              <button v-for="item in typeFilters" :key="item" :class="['assessment-filter', { active: activeType === item }]" @click="selectType(item)">
                {{ item }}
              </button>
            </view>
          </scroll-view>

          <view v-if="loading" class="assessment-card">
            <view class="assessment-info">
              <text class="assessment-title">测评加载中</text>
              <text class="assessment-desc">请稍候</text>
            </view>
          </view>

          <view v-else-if="assessments.length" class="assessment-card-list">
            <view v-for="item in assessments" :key="item.id" class="assessment-card">
              <view class="assessment-card-top">
                <view :class="['assessment-icon', item.tone]">
                  <view class="mini-icon clipboard"></view>
                </view>
                <view class="assessment-info">
                  <text class="assessment-title">{{ item.title }}</text>
                  <text class="assessment-meta">{{ item.meta }}</text>
                  <text class="assessment-desc">{{ item.desc }}</text>
                </view>
              </view>
              <view class="assessment-footer">
                <view class="assessment-tags">
                  <text v-for="tag in item.tags" :key="tag" :class="['assessment-tag', item.tone]">{{ tag }}</text>
                </view>
                <button class="assessment-start" @click="go(`/pages/student/assessment-quiz?id=${item.id}`)">开始测评</button>
              </view>
            </view>
          </view>

          <view v-else class="assessment-card">
            <view class="assessment-info">
              <text class="assessment-title">暂无可用测评</text>
              <text class="assessment-desc">心理中心发布测评后会显示在这里</text>
            </view>
          </view>

          <button class="history-link" @click="go('/pages/student/assessment-history')">查看测评历史</button>
        </view>
      </scroll-view>
    </view>

    <bottom-tabbar role="student" active="home" />
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getAssessments } from "../../api/student";
import { goPage, goPrimaryPage } from "@/utils/navigation";

const loading = ref(false);
const assessments = ref([]);
const activeType = ref("全部");
const typeFilters = ref(["全部"]);

onLoad(() => {
  loadAssessments();
});

async function loadAssessments() {
  loading.value = true;
  try {
    const params = activeType.value === "全部" ? {} : { type: activeType.value };
    const list = await getAssessments(params);
    const mapped = (Array.isArray(list) ? list : []).map(normalizeAssessment);
    assessments.value = mapped;
    if (activeType.value === "全部") {
      const types = [...new Set(mapped.map((item) => item.type).filter(Boolean))];
      typeFilters.value = ["全部", ...types];
    }
  } catch (error) {
    assessments.value = [];
    uni.showToast({ title: error.message || "测评列表加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectType(type) {
  activeType.value = type;
  loadAssessments();
}

function normalizeAssessment(item = {}, index = 0) {
  const questionCount = Array.isArray(item.questions) ? item.questions.length : 0;
  const type = item.type || "心理测评";
  const tags = item.code ? [type, item.code] : [type];
  return {
    id: item.id,
    title: item.title || "未命名测评",
    type,
    meta: `${questionCount || "若干"}道题 · 约${Math.max(3, Math.ceil((questionCount || 9) / 3))}分钟`,
    desc: item.description || "了解你当前的心理状态",
    tags,
    tone: ["blue", "orange", "purple"][index % 3]
  };
}

function go(url) {
  goPage(url);
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}
</script>

<style scoped>
.assessment-list-page {
  background: #f8fafc;
}

.assessment-content-wrap {
  flex: 1;
  min-height: 0;
}

.assessment-content {
  height: 100%;
  padding-bottom: 144rpx;
}

.assessment-inner {
  padding: 32rpx 40rpx 48rpx;
}

.assessment-intro {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 48rpx;
  padding: 32rpx;
  border-radius: 32rpx;
  background: #f0fdf4;
}

.assessment-filter-scroll {
  width: 100%;
  margin: -20rpx 0 32rpx;
  white-space: nowrap;
}

.assessment-filter-row {
  display: flex;
  gap: 16rpx;
}

.assessment-filter {
  min-width: 112rpx;
  height: 60rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  color: #6b7280;
  background: #f3f4f6;
  font-size: 24rpx;
  font-weight: 800;
}

.assessment-filter.active {
  color: #fff;
  background: #4A90D9;
}

.intro-title {
  color: #14532d;
  font-size: 28rpx;
  font-weight: 900;
}

.intro-desc {
  color: #15803d;
  font-size: 20rpx;
  line-height: 1.65;
}

.assessment-card-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.assessment-card {
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.assessment-card-top {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
}

.assessment-icon {
  width: 96rpx;
  height: 96rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.assessment-icon .mini-icon {
  width: 54rpx;
  height: 54rpx;
}

.assessment-icon.blue { color: #3b82f6; background: #eff6ff; }
.assessment-icon.orange { color: #f97316; background: #fff7ed; }
.assessment-icon.purple { color: #8b5cf6; background: #f5f3ff; }

.assessment-info {
  flex: 1;
  min-width: 0;
}

.assessment-title,
.assessment-meta,
.assessment-desc {
  display: block;
}

.assessment-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.35;
}

.assessment-meta {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 24rpx;
}

.assessment-desc {
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 20rpx;
  line-height: 1.5;
}

.assessment-footer {
  margin-top: 28rpx;
}

.assessment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.assessment-tag {
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.assessment-tag.blue { color: #2563eb; background: #eff6ff; }
.assessment-tag.orange { color: #ea580c; background: #fff7ed; }
.assessment-tag.purple { color: #7c3aed; background: #f5f3ff; }

.assessment-start {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}

.history-link {
  width: 100%;
  margin: 32rpx 0 24rpx;
  color: #9ca3af;
  background: transparent;
  font-size: 24rpx;
  font-weight: 700;
}
/* 上线前自适应收口：测评标题和说明不横向溢出。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
