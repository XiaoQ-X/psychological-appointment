<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">文章预览</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view class="sp-card cp-section-card notice-card"><text class="cp-section-title">文章预览说明</text><text class="cp-note">当前页面用于资讯预览，文章详情接入、审核和发布能力后续开放。</text></view>
          <view class="sp-card cp-article-detail"><view class="cp-article-cover large"><view class="mini-icon newspaper"></view></view><text class="cp-article-title">如何与焦虑和平相处</text><text class="cp-desc">林若澄老师 · 情绪调节 · 6 分钟阅读</text><view class="cp-divider"></view><text class="cp-paragraph">焦虑并不总是坏事，它像一个提醒器，让我们意识到当前正在面对压力。</text><text class="cp-paragraph">当焦虑出现时，可以先暂停下来，观察身体感受，再用深呼吸、任务拆分、求助同伴等方式降低压力强度。</text><text class="cp-paragraph">如果焦虑持续影响睡眠、学习或人际关系，请及时联系学校心理中心。</text></view>
        </view></scroll-view></view>
  </view>
</template>

<script setup>
import { goPage, safeBackCounselor } from "@/utils/navigation";

function go(url) { goPage(url); }
function back() { safeBackCounselor("/pages/counselor/articles"); }
function toast(title) { uni.showToast({ title, icon: 'none' }); }
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.notice-card {
  border: 1rpx solid #DBEAFE;
  background: #F8FBFF;
}

.cp-note,
.cp-article-title,
.cp-desc,
.cp-paragraph {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-paragraph {
  white-space: pre-wrap;
  line-height: 1.75;
}

.cp-article-cover.large {
  min-height: 260rpx;
}
</style>
