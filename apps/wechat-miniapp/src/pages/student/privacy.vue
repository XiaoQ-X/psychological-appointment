<template>
  <view class="mobile-container privacy-page">
    <status-bar />
    <page-header title="隐私政策" show-back @back="goBack" />

    <scroll-view class="privacy-content" scroll-y enhanced :show-scrollbar="false">
      <view class="privacy-inner">
        <!-- UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。 -->
        <view v-for="section in displaySections" :key="section.title" class="privacy-card">
          <view class="privacy-card-head">
            <view :class="['privacy-icon', section.tone]">
              <view :class="['mini-icon', section.icon]"></view>
            </view>
            <text class="privacy-title">{{ section.title }}</text>
          </view>
          <view class="privacy-body">
            <text v-for="paragraph in section.paragraphs" :key="paragraph" class="privacy-paragraph">{{ paragraph }}</text>
            <view v-if="section.items" class="privacy-list">
              <text v-for="item in section.items" :key="item" class="privacy-list-item">• {{ item }}</text>
            </view>
          </view>
        </view>

        <view class="privacy-bottom-space"></view>
      </view>
    </scroll-view>

    <view class="privacy-action-bar">
      <button class="agree-button" :disabled="saving || accepted" @click="agree">{{ agreeButtonText }}</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { acceptStudentPrivacy, getStudentPrivacy } from "../../api/student";
import { safeBackStudent } from "@/utils/navigation";

// UI 原型还原阶段静态展示数据，接口联调阶段替换真实接口数据。
const sections = [
  {
    title: "1. 信息收集",
    tone: "blue",
    icon: "newspaper",
    paragraphs: [
      "我们收集的个人信息类型包括：学号、姓名、院系、年级、联系方式等基本信息，以及咨询预约时你主动填写的咨询诉求、主诉内容等相关信息。",
      "收集目的：用于身份验证、预约管理和服务质量改进，确保为你提供最合适的心理健康服务。"
    ]
  },
  {
    title: "2. 信息使用",
    tone: "green",
    icon: "bell",
    paragraphs: [
      "你的个人信息仅用于心理健康服务目的，包括预约安排、咨询记录、风险评估和后续跟进。",
      "我们承诺：不会将你的个人信息用于学术评价、纪律处分、奖惩评定等非心理健康用途。"
    ]
  },
  {
    title: "3. 信息保护",
    tone: "yellow",
    icon: "check",
    paragraphs: [
      "所有个人信息和咨询记录均采用加密存储，仅授权人员（你的咨询师及心理中心管理人员）可访问。",
      "我们定期进行安全审计，确保数据安全。系统符合国家网络安全等级保护标准。"
    ]
  },
  {
    title: "4. 保密原则",
    tone: "purple",
    icon: "check",
    paragraphs: [
      "咨询内容严格保密，未经你的书面同意，不会向任何第三方披露。",
      "保密例外情况："
    ],
    items: ["你有伤害自己或他人的紧急风险", "法律法规要求披露", "存在严重公共卫生安全风险"]
  },
  {
    title: "5. 用户权利",
    tone: "red",
    icon: "profile",
    paragraphs: [],
    items: ["查看权：你可随时查看个人信息和咨询记录", "删除权：如需删除账号，请联系心理中心办理", "撤回授权：你可以在个人中心撤回相关授权"]
  },
  {
    title: "6. 协议条款",
    tone: "gray",
    icon: "newspaper",
    paragraphs: [
      "使用本平台即表示你同意本隐私政策。我们可能会不定期更新本政策，更新后的政策将在平台内公告。",
      "如有任何疑问，请联系心理中心：psy@edu.cn"
    ]
  }
];
const loading = ref(false);
const saving = ref(false);
const accepted = ref(false);
const acceptedAt = ref("");
const privacyContent = ref("");
const privacyVersion = ref("v1");

const displaySections = computed(() => {
  if (!privacyContent.value) return sections;
  return sections.map((section, index) => {
    if (index !== 0) return section;
    return {
      ...section,
      paragraphs: [privacyContent.value]
    };
  });
});

const agreeButtonText = computed(() => {
  if (saving.value) return "提交中...";
  if (accepted.value) return "已同意隐私政策";
  return "我已阅读并同意";
});

onShow(() => {
  loadPrivacy();
});

async function loadPrivacy() {
  loading.value = true;
  try {
    const data = await getStudentPrivacy();
    accepted.value = Boolean(data?.accepted);
    acceptedAt.value = data?.acceptedAt || "";
    privacyContent.value = data?.content || "";
    privacyVersion.value = data?.version || "v1";
  } catch (error) {
    uni.showToast({ title: error.message || "隐私授权状态加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goBack() {
  safeBackStudent("/pages/student/profile");
}

async function agree() {
  if (saving.value || accepted.value) return;
  saving.value = true;
  try {
    const data = await acceptStudentPrivacy({ version: privacyVersion.value });
    accepted.value = Boolean(data?.accepted);
    acceptedAt.value = data?.acceptedAt || "";
    uni.showToast({ title: "已同意隐私政策", icon: "none" });
    setTimeout(goBack, 500);
  } catch (error) {
    uni.showToast({ title: error.message || "提交失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.privacy-page {
  background: #f8fafc;
}

.privacy-content {
  flex: 1;
  min-height: 0;
  padding-bottom: 156rpx;
  background: #f8fafc;
}

.privacy-inner {
  padding: 32rpx 40rpx 48rpx;
}

.privacy-card {
  margin-bottom: 32rpx;
  padding: 40rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.privacy-card-head {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.privacy-icon {
  width: 64rpx;
  height: 64rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
}

.privacy-icon .mini-icon {
  width: 40rpx;
  height: 40rpx;
}

.privacy-icon.blue { color: #3b82f6; background: #eff6ff; }
.privacy-icon.green { color: #22c55e; background: #f0fdf4; }
.privacy-icon.yellow { color: #ca8a04; background: #fefce8; }
.privacy-icon.purple { color: #8b5cf6; background: #f5f3ff; }
.privacy-icon.red { color: #ef4444; background: #fef2f2; }
.privacy-icon.gray { color: #6b7280; background: #f9fafb; }

.privacy-title {
  color: #1f2937;
  font-size: 28rpx;
  font-weight: 900;
}

.privacy-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.privacy-paragraph,
.privacy-list-item {
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.7;
}

.privacy-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.privacy-bottom-space {
  height: 56rpx;
}

.privacy-action-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28rpx 40rpx 40rpx;
  border-top: 1rpx solid #f3f4f6;
  background: #fff;
}

.agree-button {
  width: 100%;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 28rpx;
  font-weight: 900;
  box-shadow: 0 10rpx 22rpx rgba(74, 144, 217, .16);
}
/* 上线前自适应收口：隐私协议长段落和底部操作区不遮挡。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
