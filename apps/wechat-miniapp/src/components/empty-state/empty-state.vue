<template>
  <view class="empty-state">
    <view class="empty-illustration">
      <view :class="['mini-icon', icon]"></view>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-desc">{{ desc }}</text>
    <button v-if="actionText" class="empty-action btn-second" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: "calendar"
  },
  title: {
    type: String,
    default: "暂无内容"
  },
  desc: {
    type: String,
    default: "相关内容会显示在这里"
  },
  actionText: {
    type: String,
    default: ""
  }
});

defineEmits(["action"]);
</script>
