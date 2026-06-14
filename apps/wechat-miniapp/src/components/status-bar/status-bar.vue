<template>
  <view class="status-bar proto-status-bar">
    <text class="status-time">{{ time }}</text>
    <view class="status-icons" aria-label="系统状态">
      <view class="mini-icon signal"></view>
      <view class="mini-icon wifi"></view>
      <view class="mini-icon battery"></view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  time: {
    type: String,
    default: "09:41"
  }
});
</script>
