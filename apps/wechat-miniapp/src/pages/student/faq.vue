<template>
  <view class="mobile-container faq-page">
    <status-bar />
    <page-header title="常见问题" show-back @back="goBack" />

    <scroll-view class="faq-tabs" scroll-x enhanced :show-scrollbar="false">
      <view class="faq-tab-row">
        <button
          v-for="category in categories"
          :key="category.key"
          :class="['faq-tab', { active: activeCategory === category.key }]"
          @click="switchCategory(category.key)"
        >
          {{ category.label }}
        </button>
      </view>
    </scroll-view>

    <scroll-view class="faq-scroll" scroll-y enhanced :show-scrollbar="false">
      <view class="faq-inner">
        <!-- 固定说明内容：FAQ 本阶段作为静态说明页保留，不接接口。 -->
        <view class="faq-card">
          <view v-for="item in currentFaqs" :key="item.q" class="accordion-item">
            <button class="accordion-head" @click="toggle(item.q)">
              <text class="accordion-title">{{ item.q }}</text>
              <text :class="['accordion-arrow', { open: openMap[item.q] }]">⌄</text>
            </button>
            <view v-if="openMap[item.q]" class="accordion-body">
              <text class="accordion-answer">{{ item.a }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <bottom-tabbar role="student" active="home" />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { safeBackStudent } from "@/utils/navigation";

// 固定说明内容：FAQ 本阶段作为静态说明页保留，不接接口。
const categories = [
  { key: "rule", label: "预约规则" },
  { key: "privacy", label: "隐私安全" },
  { key: "process", label: "咨询流程" },
  { key: "emergency", label: "紧急帮助" }
];

const faqMap = {
  rule: [
    { q: "如何预约心理咨询？", a: "预约心理咨询的步骤：1. 在首页点击预约咨询或进入咨询师列表选择咨询师；2. 选择咨询类型和可预约时间；3. 填写预约表单；4. 完成风险筛查；5. 阅读并同意知情同意书；6. 提交预约，等待老师确认。" },
    { q: "预约后可以取消吗？", a: "可以。距离预约时间超过2小时可在我的预约中取消；距离预约时间较近时，请联系心理中心协助处理。30天内多次未到可能会限制预约。" },
    { q: "预约需要多长时间？", a: "初访评估约30分钟，常规咨询约50分钟，危机干预约90分钟。具体时长以预约时显示为准。" },
    { q: "可以指定咨询师吗？", a: "可以。在咨询师列表中浏览咨询师简介、擅长领域和可约时间，选择你感兴趣的咨询师进行预约。" },
    { q: "预约费用如何？", a: "校内学生免费。拾光心理中心为在校学生提供免费心理咨询服务，如涉及校外资源转介，相关费用会提前告知。" }
  ],
  privacy: [
    { q: "咨询内容保密吗？", a: "是的，心理咨询严格遵守保密原则。未经你的书面同意，不会将咨询内容透露给任何第三方。" },
    { q: "什么情况下会打破保密？", a: "保密例外包括：存在伤害自己或他人的风险、法律法规要求披露、严重公共安全风险等。相关披露会限定在必要范围内。" },
    { q: "评估记录会记入档案吗？", a: "不会。心理咨询相关评估记录由心理中心独立保存，不会记入学籍档案、成绩单或校内正式档案。" },
    { q: "咨询记录谁可以看到？", a: "咨询记录仅限你的咨询师和心理中心内部管理使用，不会提供给院系辅导员、任课教师或其他无关人员。" }
  ],
  process: [
    { q: "第一次咨询需要准备什么？", a: "不需要特别准备。只需要放松心态，如实表达你的感受和困惑。建议提前5分钟到达心理中心签到。" },
    { q: "咨询一般几次有效果？", a: "因人而异，取决于困扰类型和严重程度。一般短程咨询6-12次可看到改善，咨询师会与你一起评估进展。" },
    { q: "可以中途更换咨询师吗？", a: "可以。如果你觉得与当前咨询师不太匹配，可以告知咨询师或联系心理中心，中心会协助你匹配合适的咨询师。" },
    { q: "咨询结束后还能再预约吗？", a: "当然可以。无论遇到新的困扰，还是希望进行定期维护，都欢迎再次预约咨询。" }
  ],
  emergency: [
    { q: "遇到紧急情况怎么办？", a: "如果你正在经历无法保证自身安全的时刻，请立即联系学校心理中心24小时热线，或前往心理中心、校医院急诊。你的安全是最重要的。" },
    { q: "非工作时间有紧急情况怎么办？", a: "非工作时间请拨打全国24小时心理援助热线或希望24热线，热线均为24小时服务，任何时候都可以拨打。" },
    { q: "热线电话是多少？", a: "学校心理中心：010-8888-8888；全国心理危机干预热线：400-161-9995；希望24热线：400-161-9995。" },
    { q: "可以匿名求助吗？", a: "可以。紧急热线支持匿名拨打，你不需要提供个人信息。紧急情况下首要任务是确保安全。" }
  ]
};

const activeCategory = ref("rule");
const openMap = reactive({ "如何预约心理咨询？": true });

const currentFaqs = computed(() => faqMap[activeCategory.value] || []);

function switchCategory(key) {
  activeCategory.value = key;
  Object.keys(openMap).forEach((item) => {
    openMap[item] = false;
  });
  const first = faqMap[key]?.[0]?.q;
  if (first) openMap[first] = true;
}

function toggle(question) {
  openMap[question] = !openMap[question];
}

function goBack() {
  safeBackStudent("/pages/student/profile");
}
</script>

<style scoped>
.faq-page {
  background: #f8fafc;
}

.faq-tabs {
  flex: none;
  width: 100%;
  min-height: 88rpx;
  overflow: hidden;
  border-bottom: 1rpx solid #f3f4f6;
  background: #fff;
}

.faq-tab-row {
  min-width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 0 40rpx;
}

.faq-tab {
  min-height: 88rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4rpx;
  border-bottom: 4rpx solid transparent;
  color: #9ca3af;
  font-size: 24rpx;
  font-weight: 800;
}

.faq-tab.active {
  color: #4A90D9;
  border-bottom-color: #4A90D9;
}

.faq-scroll {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.faq-inner {
  padding: 32rpx 40rpx 172rpx;
}

.faq-card {
  overflow: hidden;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.accordion-item + .accordion-item {
  border-top: 1rpx solid #f3f4f6;
}

.accordion-head {
  width: 100%;
  min-height: 104rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 0 32rpx;
  text-align: left;
}

.accordion-title {
  flex: 1;
  color: #1f2937;
  font-size: 26rpx;
  font-weight: 800;
  line-height: 1.45;
}

.accordion-arrow {
  flex: none;
  color: #9ca3af;
  font-size: 34rpx;
  line-height: 1;
  transform: rotate(0deg);
}

.accordion-arrow.open {
  transform: rotate(180deg);
}

.accordion-body {
  padding: 0 32rpx 30rpx;
}

.accordion-answer {
  display: block;
  padding-top: 24rpx;
  border-top: 1rpx solid #f3f4f6;
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.75;
}

/* 上线前自适应收口：固定 FAQ 长问答不横向溢出。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
