<template>
  <view class="banner-card proto-banner-card">
    <image v-if="image" class="banner-image" :src="image" mode="aspectFill" />
    <view class="banner-shade"></view>
    <view class="banner-copy">
      <text class="banner-kicker">{{ kicker }}</text>
      <text class="banner-title">{{ title }}</text>
      <view class="banner-tags">
        <text v-for="item in tags" :key="item">{{ item }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  image: {
    type: String,
    default: ""
  },
  kicker: {
    type: String,
    default: "热门课程"
  },
  title: {
    type: String,
    default: "情绪调节：与焦虑握手言和"
  },
  tags: {
    type: Array,
    default: () => ["1.2k人已学"]
  }
});
</script>
