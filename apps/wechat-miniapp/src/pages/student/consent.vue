<template>
  <view class="mobile-container sp-page consent-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons">
        <view class="mini-icon signal"></view>
        <view class="mini-icon wifi"></view>
        <view class="mini-icon battery"></view>
      </view>
    </view>

    <view class="sp-header">
      <button class="sp-back" @click="back">
        <view class="mini-icon chevron-left"></view>
      </button>
      <text class="sp-header-title">心理咨询知情同意书</text>
      <view class="sp-header-spacer"></view>
    </view>

    <view class="sp-content">
      <scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false">
        <view class="consent-stack">
          <!-- 当前使用内置协议文案；正式上线前需由学校审核版本、更新日期与生效范围。 -->
          <view class="consent-prose">
            <view class="consent-section">
              <text class="consent-section-title">一、咨询服务说明</text>
              <text class="consent-text">心理咨询是一个通过对话探讨个人困扰、促进自我成长的过程。咨询师将运用专业知识，协助您探索问题、缓解情绪、寻求应对策略。</text>
            </view>

            <view class="consent-section">
              <text class="consent-section-title">二、保密原则与例外</text>
              <text class="consent-text">咨询师对您的个人信息及咨询内容严格保密。但在以下特殊情况下，保密原则将不再适用：</text>
              <view class="consent-list">
                <text>您有自伤或自杀的明确企图；</text>
                <text>您有伤害他人的明确企图；</text>
                <text>涉及未成年人遭受虐待或性侵犯；</text>
                <text>法律诉讼需要咨询师出庭作证。</text>
              </view>
            </view>

            <view class="consent-section">
              <text class="consent-section-title">三、咨询设置</text>
              <text class="consent-text">常规咨询每次时长为 50 分钟，频率通常为每周一次。如需更改或取消预约，请至少提前 24 小时进行操作。</text>
            </view>

            <view class="consent-section">
              <text class="consent-section-title">四、双方权利与义务</text>
              <text class="consent-text">您有权随时提出终止咨询。咨询师有义务在咨询过程中保持专业伦理，并在必要时提供转介建议。</text>
            </view>

            <view class="consent-note">
              <text>* 请认真阅读以上内容。点击“确认并同意”即表示您已充分理解并愿意遵守上述协议。</text>
            </view>
          </view>

          <button class="sp-primary consent-submit" @click="back">确认并同意</button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { safeBackStudent } from "@/utils/navigation";

// UI原型还原阶段：本页条款为静态原型文本；接口联调阶段如需协议版本管理，在不改变结构的前提下替换为真实数据。
function back() {
  safeBackStudent("/pages/student/counselors");
}
</script>

<style scoped>
.consent-page {
  background: #fff;
}

.consent-stack {
  display: grid;
  gap: 48rpx;
  padding: 48rpx 48rpx 44rpx;
}

.consent-prose {
  display: grid;
  gap: 48rpx;
}

.consent-section {
  display: grid;
  gap: 18rpx;
}

.consent-section-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 900;
}

.consent-text,
.consent-list {
  color: #6b7280;
  font-size: 24rpx;
  line-height: 1.75;
}

.consent-list {
  display: grid;
  gap: 10rpx;
  padding-left: 28rpx;
}

.consent-list text {
  position: relative;
}

.consent-list text::before {
  content: "";
  position: absolute;
  left: -22rpx;
  top: 19rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #9ca3af;
}

.consent-note {
  padding: 32rpx;
  border-radius: 24rpx;
  color: #9ca3af;
  background: #f9fafb;
  font-size: 20rpx;
  line-height: 1.6;
}

.consent-submit {
  width: 100%;
  height: 96rpx;
  border-radius: 28rpx;
}
</style>
