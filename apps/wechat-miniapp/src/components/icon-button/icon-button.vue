<template>
  <button class="icon-button" :aria-label="label" @click="$emit('click')">
    <view :class="['mini-icon', icon]"></view>
    <view v-if="dot" class="icon-button-dot"></view>
  </button>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: "more"
  },
  label: {
    type: String,
    default: "操作"
  },
  dot: {
    type: Boolean,
    default: false
  }
});

defineEmits(["click"]);
</script>
