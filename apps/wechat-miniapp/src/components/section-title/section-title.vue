<template>
  <view class="section-title-row">
    <text class="section-title">{{ title }}</text>
    <button v-if="actionText" class="section-action" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: ""
  }
});

defineEmits(["action"]);
</script>
