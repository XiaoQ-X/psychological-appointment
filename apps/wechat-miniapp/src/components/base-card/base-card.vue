<template>
  <view :class="['card', customClass]">
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
