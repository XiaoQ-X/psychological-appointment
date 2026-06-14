<template>
  <view class="mobile-container sp-page cp-page">
    <view class="sp-status">
      <text>09:41</text>
      <view class="sp-status-icons"><view class="mini-icon signal"></view><view class="mini-icon wifi"></view><view class="mini-icon battery"></view></view>
    </view>
    <view class="sp-header center"><button class="sp-back" @click="back"><view class="mini-icon chevron-left"></view></button><text class="sp-header-title">文章编辑</text><view class="sp-header-spacer"></view></view>
    <view class="sp-content"><scroll-view class="sp-scroll" scroll-y enhanced :show-scrollbar="false"><view class="sp-stack cp-stack cp-no-tabbar ">
          <view class="sp-card cp-section-card locked-card">
            <text class="cp-section-title">内容维护暂未开放</text>
            <text class="cp-note">当前咨询师端仅展示文章内容预览表单，发布、审核、下架和删除能力后续开放。</text>
          </view>
          <view class="sp-card cp-section-card"><text class="cp-section-title">文章内容</text><view class="cp-form-grid"><view class="sp-field"><text class="sp-label">标题</text><input class="sp-input" disabled value="如何与焦虑和平相处" /></view><view class="sp-field"><text class="sp-label">分类</text><view class="sp-picker disabled">情绪调节</view></view><view class="sp-field"><text class="sp-label">摘要</text><textarea class="sp-textarea" disabled value="帮助学生识别焦虑信号，学习可执行的放松方法。" /></view><view class="sp-field"><text class="sp-label">正文</text><textarea class="sp-textarea long" disabled value="焦虑是一种常见情绪，它提醒我们关注压力来源。可以尝试呼吸练习、任务拆分和寻求支持。" /></view></view></view>
        </view></scroll-view></view>
    <view class="sp-bottom-actions"><button class="sp-primary disabled" disabled>暂不可维护</button></view>
  </view>
</template>

<script setup>
import { goPage, safeBackCounselor } from "@/utils/navigation";

function go(url) { goPage(url); }
function back() { safeBackCounselor("/pages/counselor/articles"); }
</script>

<style scoped>
.cp-page {
  overflow-x: hidden;
}

.cp-stack {
  padding-bottom: 180rpx;
}

.locked-card {
  border: 1rpx solid #DBEAFE;
  background: #F8FBFF;
}

.cp-note,
.sp-label,
.sp-input,
.sp-textarea,
.sp-picker {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.cp-note {
  color: #64748B;
  font-size: 23rpx;
  line-height: 1.6;
}

.sp-textarea.long {
  min-height: 260rpx;
}

.sp-picker.disabled,
.sp-primary.disabled {
  opacity: .58;
}
</style>
