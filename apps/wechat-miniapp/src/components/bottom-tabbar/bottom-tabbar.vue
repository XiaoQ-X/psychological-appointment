<template>
  <view :class="['bottom-tabbar', 'custom-tabbar-safe', `${role}-bottom-tabbar`]">
    <button
      v-for="item in tabs"
      :key="item.key"
      :class="['bottom-tabbar-item', { active: active === item.key }]"
      @click="go(item)"
    >
      <view :class="['mini-icon', item.icon]"></view>
      <text>{{ item.label }}</text>
    </button>
  </view>
</template>

<script setup>
import { computed } from "vue";
import { goPrimaryPage } from "../../utils/navigation.js";

const props = defineProps({
  role: {
    type: String,
    default: "student"
  },
  active: {
    type: String,
    default: ""
  }
});

const studentTabs = [
  { key: "home", label: "首页", icon: "home", url: "/pages/student/home" },
  { key: "booking", label: "预约", icon: "calendar", url: "/pages/student/counselors" },
  { key: "articles", label: "资讯", icon: "newspaper", url: "/pages/student/articles" },
  { key: "profile", label: "我的", icon: "profile", url: "/pages/student/profile" }
];

const counselorTabs = [
  { key: "dashboard", label: "工作台", icon: "dashboard", url: "/pages/counselor/dashboard" },
  { key: "appointments", label: "预约", icon: "calendar", url: "/pages/counselor/appointments" },
  { key: "students", label: "学生", icon: "students", url: "/pages/counselor/students" },
  { key: "profile", label: "我的", icon: "profile", url: "/pages/counselor/profile" }
];

const tabs = computed(() => (props.role === "counselor" ? counselorTabs : studentTabs));

function go(item) {
  if (props.active === item.key) return;
  goPrimaryPage(item.url);
}
</script>
