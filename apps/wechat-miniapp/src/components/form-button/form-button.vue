<template>
  <button :class="['form-button', `form-button-${type}`]" @click="$emit('click')">
    <slot></slot>
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: "primary"
  }
});

defineEmits(["click"]);
</script>
