<template>
  <view class="mobile-container emergency-page">
    <status-bar />
    <page-header title="紧急帮助" show-back @back="goHome" />

    <scroll-view class="emergency-scroll" scroll-y enhanced :show-scrollbar="false">
      <view class="emergency-inner">
        <!-- 固定说明内容：紧急帮助本阶段作为静态说明页保留，热线与导航说明不接接口。 -->
        <view class="crisis-note">
          <view class="note-icon"><view class="mini-icon heart"></view></view>
          <view class="note-main">
            <text class="note-title">如果你正在经历无法保证自身安全的时刻</text>
            <text class="note-desc">请优先联系紧急资源。你不需要独自承受，我们在这里陪伴你。</text>
          </view>
        </view>

        <view v-for="item in resources" :key="item.title" class="resource-card">
          <view class="resource-head">
            <view :class="['resource-icon', item.tone]">
              <view :class="['mini-icon', item.icon]"></view>
            </view>
            <view class="resource-main">
              <text class="resource-title">{{ item.title }}</text>
              <text class="resource-desc">{{ item.desc }}</text>
            </view>
          </view>

          <view :class="['phone-box', item.tone]">
            <view class="mini-icon bell"></view>
            <text class="phone-number">{{ item.phone }}</text>
          </view>

          <view class="resource-actions">
            <button v-if="item.phoneNumber" :class="['call-button', item.tone]" @click="call(item.phoneNumber)">拨打</button>
            <button v-if="item.map" class="map-button" @click="openMap(item)">导航</button>
            <button v-else-if="item.locationOnly" class="map-button disabled" disabled>校内指引</button>
          </view>
        </view>

        <button class="home-link" @click="goHome">这不是紧急情况？返回首页 →</button>
      </view>
    </scroll-view>

    <bottom-tabbar role="student" active="home" />
  </view>
</template>

<script setup>
import { goPrimaryPage } from "@/utils/navigation";

// 固定说明内容：紧急帮助本阶段作为静态说明页保留，热线与导航说明不接接口。
const resources = [
  { title: "学校心理中心（24小时热线）", desc: "学生活动中心3层", phone: "010-8888-8888", phoneNumber: "01088888888", tone: "blue", icon: "bell", locationOnly: true },
  { title: "全国心理危机干预热线", desc: "24小时 · 全国覆盖", phone: "400-161-9995", phoneNumber: "4001619995", tone: "red", icon: "alert" },
  { title: "希望24热线", desc: "24小时 · 全国覆盖", phone: "400-161-9995", phoneNumber: "4001619995", tone: "purple", icon: "bell" },
  { title: "校医院急诊", desc: "校园东区 · 校医院急诊科", phone: "24小时急诊服务", tone: "green", icon: "check", locationOnly: true }
];

function call(phoneNumber) {
  uni.makePhoneCall({ phoneNumber });
}

function openMap(item) {
  if (!item.map?.latitude || !item.map?.longitude) return;
  uni.openLocation({
    latitude: item.map.latitude,
    longitude: item.map.longitude,
    name: item.title,
    address: item.desc,
    scale: 18
  });
}

function goHome() {
  goPrimaryPage("/pages/student/home");
}
</script>

<style scoped>
.emergency-page {
  background: #f8fafc;
}

.emergency-scroll {
  flex: 1;
  min-height: 0;
  background: #f8fafc;
}

.emergency-inner {
  padding: 32rpx 40rpx 172rpx;
}

.crisis-note {
  display: flex;
  align-items: flex-start;
  gap: 22rpx;
  margin-bottom: 28rpx;
  padding: 30rpx;
  border: 1rpx solid #fed7aa;
  border-radius: 32rpx;
  background: #fff7ed;
}

.note-icon {
  width: 56rpx;
  height: 56rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #f97316;
  background: #ffedd5;
}

.note-main {
  flex: 1;
  min-width: 0;
}

.note-title {
  display: block;
  color: #7c2d12;
  font-size: 26rpx;
  line-height: 1.5;
  font-weight: 900;
}

.note-desc {
  display: block;
  margin-top: 8rpx;
  color: #c2410c;
  font-size: 23rpx;
  line-height: 1.6;
}

.resource-card {
  margin-bottom: 24rpx;
  padding: 32rpx;
  border: 1rpx solid #f3f4f6;
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, .05);
}

.resource-head {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.resource-icon {
  width: 80rpx;
  height: 80rpx;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
}

.resource-icon.blue { color: #4A90D9; background: #EBF3FC; }
.resource-icon.red { color: #ef4444; background: #fef2f2; }
.resource-icon.purple { color: #8b5cf6; background: #f5f3ff; }
.resource-icon.green { color: #10b981; background: #ecfdf5; }

.resource-main {
  flex: 1;
  min-width: 0;
}

.resource-title {
  display: block;
  color: #1f2937;
  font-size: 26rpx;
  line-height: 1.45;
  font-weight: 900;
}

.resource-desc {
  display: block;
  margin-top: 6rpx;
  color: #9ca3af;
  font-size: 22rpx;
}

.phone-box {
  min-height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin: 24rpx 0;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: #EBF3FC;
}

.phone-box.red { background: #fef2f2; }
.phone-box.purple { background: #f5f3ff; }
.phone-box.green { background: #ecfdf5; }

.phone-number {
  flex: 1;
  color: #357ABD;
  font-size: 28rpx;
  text-align: right;
  font-weight: 900;
}

.phone-box.red .phone-number { color: #dc2626; }
.phone-box.purple .phone-number { color: #7c3aed; }
.phone-box.green .phone-number { color: #047857; }

.resource-actions {
  display: flex;
  gap: 20rpx;
}

.call-button,
.map-button {
  min-height: 88rpx;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  color: #fff;
  background: #4A90D9;
  font-size: 26rpx;
  font-weight: 900;
}

.call-button.red { background: #ef4444; }
.call-button.purple { background: #8b5cf6; }
.call-button.green { background: #10b981; }

.map-button {
  color: #4b5563;
  background: #f3f4f6;
}

.map-button.disabled {
  color: #94a3b8;
  background: #f8fafc;
}

.home-link {
  width: 100%;
  min-height: 72rpx;
  color: #9ca3af;
  font-size: 24rpx;
  font-weight: 700;
}

/* 上线前自适应收口：热线、地址和危机提示长文本不撑破卡片。 */
text,
button {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}
</style>
