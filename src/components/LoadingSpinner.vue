/**
 * LoadingSpinner component.
 * Renders a CSS-animated circular spinner with configurable size and color.
 */
<script setup lang="ts">
defineProps<{
  /** Spinner diameter: sm (16px), md (32px, default), lg (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Tailwind text color class (e.g. 'text-white'). Defaults to 'text-primary-600' */
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
