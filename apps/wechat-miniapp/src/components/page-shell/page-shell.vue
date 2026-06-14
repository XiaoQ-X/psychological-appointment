<template>
  <view :class="['mobile-container', 'page-shell', customClass]">
    <slot></slot>
  </view>
</template>

<script setup>
defineProps({
  customClass: {
    type: String,
    default: ""
  }
});
</script>
