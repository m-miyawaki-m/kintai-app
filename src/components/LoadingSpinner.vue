<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()
</script>

<template>
  <div class="flex items-center justify-center">
    <div
      :class="[
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8',
        color || 'text-primary-600'
      ]"
    ></div>
  </div>
</template>
