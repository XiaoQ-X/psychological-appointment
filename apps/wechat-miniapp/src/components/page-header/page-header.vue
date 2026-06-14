<template>
  <view :class="['proto-header', { 'title-only': !showBack && !actionIcon && !actionLabel }]">
    <button v-if="showBack" class="back-button" @click="$emit('back')">
      <view class="mini-icon chevron-left"></view>
    </button>
    <view v-else-if="brand" class="brand-line">
      <view class="brand-logo primary-gradient">
        <view class="mini-icon heart"></view>
      </view>
      <text>{{ brand }}</text>
    </view>
    <view v-else class="header-spacer"></view>

    <text v-if="title" class="page-title">{{ title }}</text>

    <button v-if="actionIcon || actionLabel" class="header-icon-button" @click="$emit('action')">
      <view v-if="actionIcon" :class="['mini-icon', actionIcon]"></view>
      <text v-else>{{ actionLabel }}</text>
    </button>
    <view v-else class="header-spacer"></view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ""
  },
  brand: {
    type: String,
    default: ""
  },
  showBack: {
    type: Boolean,
    default: false
  },
  actionIcon: {
    type: String,
    default: ""
  },
  actionLabel: {
    type: String,
    default: ""
  }
});

defineEmits(["back", "action"]);
</script>
