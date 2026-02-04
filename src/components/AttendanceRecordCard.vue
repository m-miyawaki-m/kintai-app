<script setup lang="ts">
import type { AttendanceRecord } from '@/types'
import type { Timestamp } from 'firebase/firestore'

interface Props {
  clockIn?: AttendanceRecord | null
  clockOut?: AttendanceRecord | null
  userName?: string
  showStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  clockIn: null,
  clockOut: null,
  userName: '',
  showStatus: true
})

function formatTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '--:--'
  const date = timestamp.toDate()
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatus() {
  if (!props.clockIn) return { text: '未出勤', class: 'bg-gray-100 text-gray-600' }
  if (!props.clockOut) return { text: '勤務中', class: 'bg-green-100 text-green-700' }
  return { text: '退勤済', class: 'bg-blue-100 text-blue-700' }
}
</script>

<template>
  <div class="flex items-center gap-4 p-3 border rounded-lg bg-white">
    <!-- User name -->
    <div v-if="userName" class="font-medium min-w-[100px]">
      {{ userName }}
    </div>

    <!-- Status -->
    <span
      v-if="showStatus"
      :class="['px-2 py-1 text-xs font-medium rounded whitespace-nowrap', getStatus().class]"
    >
      {{ getStatus().text }}
    </span>

    <!-- Clock In -->
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <span class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 whitespace-nowrap">
        出勤
      </span>
      <span class="font-medium whitespace-nowrap">{{ formatTime(clockIn?.timestamp) }}</span>
      <span class="text-sm text-gray-500 truncate">
        {{ clockIn?.location?.address || '-' }}
      </span>
    </div>

    <!-- Clock Out -->
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <span class="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 whitespace-nowrap">
        退勤
      </span>
      <span class="font-medium whitespace-nowrap">{{ formatTime(clockOut?.timestamp) }}</span>
      <span class="text-sm text-gray-500 truncate">
        {{ clockOut?.location?.address || '-' }}
      </span>
    </div>
  </div>
</template>
