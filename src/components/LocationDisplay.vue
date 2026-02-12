/**
 * LocationDisplay component.
 * Shows the current geolocation state: loading spinner, resolved address, error, or prompt.
 */
<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'

defineProps<{
  /** Whether the geolocation request is in progress */
  loading: boolean
  /** Resolved street address, or null if not yet fetched */
  address: string | null
  /** Error message from geolocation, or null if no error */
  error: string | null
}>()
</script>

<template>
  <div class="bg-gray-50 rounded-lg p-4">
    <div v-if="loading" class="flex items-center space-x-3">
      <LoadingSpinner size="sm" />
      <span class="text-gray-600">位置情報を取得中...</span>
    </div>
    <div v-else-if="error" class="text-red-600">
      {{ error }}
    </div>
    <div v-else-if="address" class="space-y-1">
      <div class="text-sm text-gray-500">現在地</div>
      <div class="text-gray-900 font-medium">{{ address }}</div>
    </div>
    <div v-else class="text-gray-500">
      ボタンを押すと位置情報を取得します
    </div>
  </div>
</template>
